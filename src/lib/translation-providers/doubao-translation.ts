import "server-only";

import { fetchWithRetry } from "@/lib/fetch-with-retry";
import {
  buildDoubaoTranslationRequestBody,
  buildDoubaoTranslationResult,
  listDoubaoTranslationSegments,
  parseDoubaoTranslationDocument,
  type DoubaoTranslationSegment,
} from "@/lib/translation-providers/doubao-translation-document";
import { TranslationProviderRequestError } from "@/lib/translation-providers/types";
import type {
  StructuredTranslationRequest,
  StructuredTranslationResult,
  TranslationProvider,
  TranslationProviderConfig,
} from "@/lib/translation-providers/types";

type TranslationResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { code?: string; message?: string } | null;
  incomplete_details?: { reason?: string } | null;
};

type SegmentResult = {
  key: string;
  text: string;
  responseId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  warnings: string[];
};

const responseText = (payload: TranslationResponse) => {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) {
        throw new TranslationProviderRequestError(`豆包翻译模型拒绝了任务：${content.refusal}`, "PROVIDER_RESPONSE", false);
      }
      if (content.type === "output_text" && content.text?.trim()) return content.text.trim();
    }
  }
  throw new TranslationProviderRequestError(
    payload.incomplete_details?.reason
      ? `豆包翻译模型响应不完整：${payload.incomplete_details.reason}`
      : "豆包翻译模型没有返回译文。",
    "PROVIDER_RESPONSE",
    false,
  );
};

const errorFromStatus = (status: number, message: string) => {
  const errorType = status === 429
    ? "RATE_LIMIT"
    : status >= 500
      ? "PROVIDER_5XX"
      : status === 408
        ? "TIMEOUT"
        : "PROVIDER_4XX";
  return new TranslationProviderRequestError(
    message,
    errorType,
    status === 408 || status === 409 || status === 429 || status >= 500,
    status,
  );
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const protectGlossaryTerms = (
  text: string,
  terms: StructuredTranslationRequest["glossaryTerms"],
) => {
  const replacements: Array<{ marker: string; target: string }> = [];
  let protectedText = text;
  const relevant = (terms ?? [])
    .filter((term) => term.source.trim() && term.target.trim())
    .sort((left, right) => right.source.length - left.source.length);
  for (const term of relevant) {
    const pattern = new RegExp(escapeRegex(term.source), "giu");
    if (!pattern.test(protectedText)) continue;
    const marker = `__TOOYEI_TERM_${replacements.length}__`;
    protectedText = protectedText.replace(pattern, marker);
    replacements.push({ marker, target: term.target });
  }
  return { protectedText, replacements };
};

const restoreGlossaryTerms = (
  text: string,
  replacements: Array<{ marker: string; target: string }>,
) => {
  const warnings: string[] = [];
  let restored = text;
  for (const replacement of replacements) {
    if (!restored.includes(replacement.marker)) {
      warnings.push(`翻译模型未原样保留术语占位符 ${replacement.marker}，请人工核对该字段术语。`);
      continue;
    }
    restored = restored.replaceAll(replacement.marker, replacement.target);
  }
  return { text: restored, warnings };
};

const parseConcurrency = () => {
  const value = Number(process.env.DOUBAO_TRANSLATION_CONCURRENCY);
  return Number.isFinite(value) ? Math.max(1, Math.min(8, Math.round(value))) : 6;
};

async function mapConcurrent<T, R>(items: readonly T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const output = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return output;
}

export class DoubaoTranslationProvider implements TranslationProvider {
  readonly id = "volcengine-doubao" as const;
  readonly label = "豆包 Seed Translation";

  constructor(private readonly config: TranslationProviderConfig) {}

  private async translateSegment(
    segment: DoubaoTranslationSegment,
    request: StructuredTranslationRequest,
    signal: AbortSignal,
  ): Promise<SegmentResult> {
    const { protectedText, replacements } = protectGlossaryTerms(segment.text, request.glossaryTerms);
    const response = await fetchWithRetry(`${this.config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildDoubaoTranslationRequestBody({
        model: this.config.model,
        text: protectedText,
        sourceLanguage: request.sourceLanguage!,
        targetLanguage: request.targetLanguage!,
        maxOutputTokens: request.maxOutputTokens,
      })),
      signal,
      timeoutMs: this.config.timeoutMs,
      retries: 0,
    });
    const payload = (await response.json().catch(() => null)) as TranslationResponse | null;
    if (!response.ok || !payload) {
      throw errorFromStatus(
        response.status,
        payload?.error?.message || `豆包翻译模型请求失败（HTTP ${response.status}）。`,
      );
    }
    if (payload.error?.message) {
      throw new TranslationProviderRequestError(payload.error.message, "PROVIDER_RESPONSE", false);
    }
    const restored = restoreGlossaryTerms(responseText(payload), replacements);
    return {
      key: segment.key,
      text: restored.text,
      responseId: payload.id ?? null,
      promptTokens: payload.usage?.input_tokens ?? null,
      completionTokens: payload.usage?.output_tokens ?? null,
      totalTokens: payload.usage?.total_tokens ?? (
        payload.usage?.input_tokens !== undefined && payload.usage?.output_tokens !== undefined
          ? payload.usage.input_tokens + payload.usage.output_tokens
          : null
      ),
      warnings: restored.warnings,
    };
  }

  async generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult> {
    if (!request.sourceLanguage || !request.targetLanguage) {
      throw new TranslationProviderRequestError("豆包专用翻译模型缺少源语言或目标语言。", "PROVIDER_RESPONSE", false);
    }
    let document;
    try {
      document = parseDoubaoTranslationDocument(request.sourceJson);
    } catch {
      throw new TranslationProviderRequestError("豆包专用翻译模型收到的产品结构不是有效 JSON。", "PROVIDER_RESPONSE", false);
    }
    const segments = listDoubaoTranslationSegments(document);
    if (!segments.length) {
      const built = buildDoubaoTranslationResult(document, new Map());
      return {
        responseId: null,
        outputText: JSON.stringify(built.output),
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        warnings: built.warnings,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new DOMException(`Request timed out after ${this.config.timeoutMs}ms`, "TimeoutError")),
      this.config.timeoutMs,
    );
    try {
      const results = await mapConcurrent(
        segments,
        parseConcurrency(),
        (segment) => this.translateSegment(segment, request, controller.signal),
      );
      const built = buildDoubaoTranslationResult(
        document,
        new Map(results.map((result) => [result.key, result.text])),
      );
      const sum = (field: "promptTokens" | "completionTokens" | "totalTokens") => {
        const values = results.map((result) => result[field]).filter((value): value is number => value !== null);
        return values.length ? values.reduce((total, value) => total + value, 0) : null;
      };
      return {
        responseId: results.find((result) => result.responseId)?.responseId ?? null,
        outputText: JSON.stringify(built.output),
        promptTokens: sum("promptTokens"),
        completionTokens: sum("completionTokens"),
        totalTokens: sum("totalTokens"),
        warnings: [...results.flatMap((result) => result.warnings), ...built.warnings],
      };
    } catch (error) {
      controller.abort();
      if (error instanceof TranslationProviderRequestError) throw error;
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError" || /timeout/i.test(error.message))) {
        throw new TranslationProviderRequestError("豆包专用翻译模型请求超时。", "TIMEOUT", true);
      }
      if (error instanceof TypeError) {
        throw new TranslationProviderRequestError(`豆包专用翻译模型网络请求失败：${error.message}`, "NETWORK", true);
      }
      throw new TranslationProviderRequestError(
        error instanceof Error ? error.message : "豆包专用翻译模型返回了不可用的响应。",
        "PROVIDER_RESPONSE",
        false,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

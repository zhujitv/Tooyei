import "server-only";

import { fetchWithRetry } from "@/lib/fetch-with-retry";
import {
  buildDoubaoTranslationRequestBody,
  buildDoubaoTranslationResult,
  listDoubaoTranslationSegments,
  parseDoubaoTranslationDocument,
  type DoubaoTranslationSegment,
} from "@/lib/translation-providers/doubao-translation-document";
import {
  protectTranslationText,
  protectedPlaceholderInstruction,
  restoreProtectedTerms,
  validateProtectedPlaceholders,
  validateRestoredTerms,
} from "@/lib/translation/protected-terms";
import { SEO_DESCRIPTION_LIMITS } from "@/lib/translation/quality";
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

  private async requestText({
    text,
    sourceLanguage,
    targetLanguage,
    instructions,
    maxOutputTokens,
    signal,
  }: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    instructions: string;
    maxOutputTokens: number;
    signal: AbortSignal;
  }) {
    const response = await fetchWithRetry(`${this.config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildDoubaoTranslationRequestBody({
        model: this.config.model,
        text,
        sourceLanguage,
        targetLanguage,
        maxOutputTokens,
        instructions,
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
    return { payload, text: responseText(payload) };
  }

  private async translateSegment(
    segment: DoubaoTranslationSegment,
    request: StructuredTranslationRequest,
    signal: AbortSignal,
  ): Promise<SegmentResult> {
    let protectedValue = protectTranslationText(segment.text, request.glossaryTerms);
    const retryFeedback = request.retryFeedback?.length
      ? ` The previous output failed validation for these reasons: ${request.retryFeedback.join(" ")} Regenerate and correct only these issues.`
      : "";
    let response = await this.requestText({
      text: protectedValue.text,
      sourceLanguage: request.sourceLanguage!,
      targetLanguage: request.targetLanguage!,
      instructions: `${protectedPlaceholderInstruction}${retryFeedback}`,
      maxOutputTokens: request.maxOutputTokens,
      signal,
    });
    const validateAndRestore = (translatedText: string) => {
      const placeholderIssues = validateProtectedPlaceholders(translatedText, protectedValue);
      if (placeholderIssues.length) {
        throw new TranslationProviderRequestError(
          `术语占位符校验失败：${placeholderIssues.map((entry) => entry.message).join(" ")}`,
          "QA_VALIDATION",
          true,
        );
      }
      const restoredText = restoreProtectedTerms(translatedText, protectedValue);
      const termIssues = validateRestoredTerms(restoredText, protectedValue);
      if (termIssues.length) {
        throw new TranslationProviderRequestError(
          `受保护术语恢复失败：${termIssues.map((entry) => entry.message).join(" ")}`,
          "QA_VALIDATION",
          true,
        );
      }
      return restoredText;
    };
    let translatedText = validateAndRestore(response.text);
    const responses = [response.payload];
    const targetLocale = request.targetLanguage!.toUpperCase();
    const seoLimit = SEO_DESCRIPTION_LIMITS[targetLocale]?.max ?? segment.maxLength;
    if (segment.key === "product.seoDescription" && translatedText.length > seoLimit) {
      for (let rewriteAttempt = 0; rewriteAttempt < 2 && translatedText.length > seoLimit; rewriteAttempt += 1) {
        protectedValue = protectTranslationText(translatedText, request.glossaryTerms);
        response = await this.requestText({
          text: protectedValue.text,
          sourceLanguage: request.targetLanguage!,
          targetLanguage: request.targetLanguage!,
          instructions: [
            "Rewrite the following SEO description in the target language.",
            "Preserve the original meaning and all protected product terms.",
            "Use one or two complete natural sentences and do not end mid-sentence.",
            "Do not add unsupported claims.",
            `Keep the result within ${seoLimit} characters.`,
            protectedPlaceholderInstruction,
          ].join(" "),
          maxOutputTokens: request.maxOutputTokens,
          signal,
        });
        responses.push(response.payload);
        translatedText = validateAndRestore(response.text);
      }
    }
    const usageValues = (field: "input_tokens" | "output_tokens" | "total_tokens") => responses
      .map((payload) => payload.usage?.[field])
      .filter((value): value is number => typeof value === "number");
    const usageSum = (field: "input_tokens" | "output_tokens" | "total_tokens") => {
      const values = usageValues(field);
      return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
    };
    return {
      key: segment.key,
      text: translatedText,
      responseId: responses.find((payload) => payload.id)?.id ?? null,
      promptTokens: usageSum("input_tokens"),
      completionTokens: usageSum("output_tokens"),
      totalTokens: usageSum("total_tokens") ?? (
        usageSum("input_tokens") !== null && usageSum("output_tokens") !== null
          ? usageSum("input_tokens")! + usageSum("output_tokens")!
          : null
      ),
      warnings: [],
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

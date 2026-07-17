import "server-only";

import { TranslationProviderRequestError } from "@/lib/translation-providers/types";
import type {
  StructuredTranslationRequest,
  StructuredTranslationResult,
  TranslationProvider,
  TranslationProviderConfig,
} from "@/lib/translation-providers/types";

type ResponsesPayload = {
  id?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { message?: string } | null;
  incomplete_details?: { reason?: string } | null;
};

const outputText = (payload: ResponsesPayload) => {
  if (payload.output_text?.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) throw new Error(`模型拒绝了翻译任务：${content.refusal}`);
      if (content.type === "output_text" && content.text?.trim()) return content.text;
    }
  }
  throw new Error(payload.incomplete_details?.reason
    ? `模型响应不完整：${payload.incomplete_details.reason}`
    : "Provider 没有返回可用的结构化内容。");
};

export class OpenAIResponsesProvider implements TranslationProvider {
  readonly id = "openai-responses" as const;
  readonly label = "OpenAI Responses";

  constructor(private readonly config: TranslationProviderConfig) {}

  async generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          input: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.sourceJson },
          ],
          text: {
            format: {
              type: "json_schema",
              name: request.schemaName,
              schema: request.schema,
              strict: true,
            },
          },
          max_output_tokens: request.maxOutputTokens,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      const payload = (await response.json().catch(() => null)) as ResponsesPayload | null;
      if (!response.ok || !payload) {
        const errorType = response.status === 429
          ? "RATE_LIMIT"
          : response.status >= 500
            ? "PROVIDER_5XX"
            : response.status === 408
              ? "TIMEOUT"
              : "PROVIDER_4XX";
        throw new TranslationProviderRequestError(
          payload?.error?.message || `${this.label} 请求失败（HTTP ${response.status}）。`,
          errorType,
          response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500,
          response.status,
        );
      }
      if (payload.error?.message) {
        throw new TranslationProviderRequestError(payload.error.message, "PROVIDER_RESPONSE", false);
      }
      return {
        responseId: payload.id ?? null,
        outputText: outputText(payload),
        promptTokens: payload.usage?.input_tokens ?? null,
        completionTokens: payload.usage?.output_tokens ?? null,
        totalTokens: payload.usage?.total_tokens ?? (
          payload.usage?.input_tokens !== undefined && payload.usage?.output_tokens !== undefined
            ? payload.usage.input_tokens + payload.usage.output_tokens
            : null
        ),
      };
    } catch (error) {
      if (error instanceof TranslationProviderRequestError) throw error;
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError" || /timeout/i.test(error.message))) {
        throw new TranslationProviderRequestError(`${this.label} 请求超时。`, "TIMEOUT", true);
      }
      if (error instanceof TypeError) {
        throw new TranslationProviderRequestError(`${this.label} 网络请求失败：${error.message}`, "NETWORK", true);
      }
      throw new TranslationProviderRequestError(
        error instanceof Error ? error.message : `${this.label} 返回了不可用的响应。`,
        "PROVIDER_RESPONSE",
        false,
      );
    }
  }
}

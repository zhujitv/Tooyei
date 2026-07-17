import "server-only";

import OpenAI from "openai";
import { TranslationProviderRequestError } from "@/lib/translation-providers/types";
import type {
  StructuredTranslationRequest,
  StructuredTranslationResult,
  TranslationProvider,
  TranslationProviderConfig,
} from "@/lib/translation-providers/types";

export class OpenAICompatibleProvider implements TranslationProvider {
  readonly id: TranslationProviderConfig["id"];
  readonly label: string;

  constructor(private readonly config: TranslationProviderConfig) {
    this.id = config.id;
    this.label = config.label;
  }

  async generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult> {
    const responseFormat = this.config.responseFormat === "json_object"
      ? { type: "json_object" as const }
      : {
          type: "json_schema" as const,
          json_schema: { name: request.schemaName, schema: request.schema, strict: true },
        };
    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      // Retries are coordinated by the persisted job worker so every real
      // provider call is reflected in attemptCount and the attempt log.
      maxRetries: 0,
    });
    try {
      const completion = await client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.sourceJson },
        ],
        response_format: responseFormat,
        max_tokens: request.maxOutputTokens,
      });
      const message = completion.choices[0]?.message;
      if (message?.refusal) throw new Error(`模型拒绝了翻译任务：${message.refusal}`);
      if (!message?.content?.trim()) throw new Error("Provider 没有返回可用的结构化内容。");
      return {
        responseId: completion.id || null,
        outputText: message.content,
        promptTokens: completion.usage?.prompt_tokens ?? null,
        completionTokens: completion.usage?.completion_tokens ?? null,
        totalTokens: completion.usage?.total_tokens ?? (
          completion.usage?.prompt_tokens !== undefined && completion.usage?.completion_tokens !== undefined
            ? completion.usage.prompt_tokens + completion.usage.completion_tokens
            : null
        ),
      };
    } catch (error) {
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        throw new TranslationProviderRequestError(`${this.label} 请求超时。`, "TIMEOUT", true);
      }
      if (error instanceof OpenAI.APIConnectionError) {
        throw new TranslationProviderRequestError(`${this.label} 网络请求失败：${error.message}`, "NETWORK", true);
      }
      if (error instanceof OpenAI.APIError) {
        const details = [error.status ? `HTTP ${error.status}` : null, error.code].filter(Boolean).join(" / ");
        const status = error.status ?? null;
        const errorType = status === 429
          ? "RATE_LIMIT"
          : status !== null && status >= 500
            ? "PROVIDER_5XX"
            : status === 408
              ? "TIMEOUT"
              : "PROVIDER_4XX";
        throw new TranslationProviderRequestError(
          `${this.label} 请求失败${details ? `（${details}）` : ""}：${error.message}`,
          errorType,
          status === 408 || status === 409 || status === 429 || (status !== null && status >= 500),
          status,
        );
      }
      if (error instanceof Error && (error.name === "AbortError" || /timeout|timed out/i.test(error.message))) {
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

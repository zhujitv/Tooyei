import "server-only";

import OpenAI from "openai";
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
      maxRetries: 2,
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
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        const details = [error.status ? `HTTP ${error.status}` : null, error.code].filter(Boolean).join(" / ");
        throw new Error(`${this.label} 请求失败${details ? `（${details}）` : ""}：${error.message}`);
      }
      throw error;
    }
  }
}

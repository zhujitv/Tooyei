import "server-only";

import type {
  StructuredTranslationRequest,
  StructuredTranslationResult,
  TranslationProvider,
  TranslationProviderConfig,
} from "@/lib/translation-providers/types";

type ChatCompletionsPayload = {
  id?: string;
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }>; refusal?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string } | null;
};

const messageText = (payload: ChatCompletionsPayload) => {
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`模型拒绝了翻译任务：${message.refusal}`);
  if (typeof message?.content === "string" && message.content.trim()) return message.content;
  if (Array.isArray(message?.content)) {
    const text = message.content.map((part) => part.text ?? "").join("").trim();
    if (text) return text;
  }
  throw new Error("Provider 没有返回可用的结构化内容。");
};

export class OpenAICompatibleProvider implements TranslationProvider {
  readonly id = "openai-compatible" as const;
  readonly label = "OpenAI-compatible API";

  constructor(private readonly config: TranslationProviderConfig) {}

  async generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult> {
    const responseFormat = this.config.responseFormat === "json_object"
      ? { type: "json_object" }
      : {
          type: "json_schema",
          json_schema: { name: request.schemaName, schema: request.schema, strict: true },
        };
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.sourceJson },
        ],
        response_format: responseFormat,
        max_tokens: request.maxOutputTokens,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
    const payload = (await response.json().catch(() => null)) as ChatCompletionsPayload | null;
    if (!response.ok || !payload) {
      throw new Error(payload?.error?.message || `${this.label} 请求失败（HTTP ${response.status}）。`);
    }
    if (payload.error?.message) throw new Error(payload.error.message);
    return {
      responseId: payload.id ?? null,
      outputText: messageText(payload),
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0,
    };
  }
}

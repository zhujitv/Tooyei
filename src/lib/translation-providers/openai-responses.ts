import "server-only";

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
  usage?: { input_tokens?: number; output_tokens?: number };
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
      throw new Error(payload?.error?.message || `${this.label} 请求失败（HTTP ${response.status}）。`);
    }
    if (payload.error?.message) throw new Error(payload.error.message);
    return {
      responseId: payload.id ?? null,
      outputText: outputText(payload),
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    };
  }
}

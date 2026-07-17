import "server-only";

export const translationProviderIds = [
  "openai-responses",
  "openai-compatible",
  "volcengine-doubao",
] as const;

export type TranslationProviderId = (typeof translationProviderIds)[number];
export type TranslationResponseFormat = "json_schema" | "json_object";

export type TranslationProviderConfig = {
  id: TranslationProviderId;
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  responseFormat: TranslationResponseFormat;
};

export type StructuredTranslationRequest = {
  systemPrompt: string;
  sourceJson: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
};

export type StructuredTranslationResult = {
  responseId: string | null;
  outputText: string;
  inputTokens: number;
  outputTokens: number;
};

export interface TranslationProvider {
  readonly id: TranslationProviderId;
  readonly label: string;
  generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult>;
}

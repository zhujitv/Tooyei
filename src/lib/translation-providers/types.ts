import "server-only";

export const translationProviderIds = [
  "openai-responses",
  "openai-compatible",
  "volcengine-doubao",
] as const;

export type TranslationProviderId = (typeof translationProviderIds)[number];
export const productTranslationProviderId = "volcengine-doubao" as const satisfies TranslationProviderId;
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
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export type TranslationProviderErrorType =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "NETWORK"
  | "PROVIDER_5XX"
  | "PROVIDER_4XX"
  | "PROVIDER_RESPONSE";

export class TranslationProviderRequestError extends Error {
  readonly name = "TranslationProviderRequestError";

  constructor(
    message: string,
    readonly errorType: TranslationProviderErrorType,
    readonly retryable: boolean,
    readonly status: number | null = null,
  ) {
    super(message);
  }
}

export interface TranslationProvider {
  readonly id: TranslationProviderId;
  readonly label: string;
  generateStructured(request: StructuredTranslationRequest): Promise<StructuredTranslationResult>;
}

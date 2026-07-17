import "server-only";

import type {
  TranslationProviderConfig,
  TranslationProviderId,
  TranslationResponseFormat,
} from "@/lib/translation-providers/types";

const providerAliases: Record<string, TranslationProviderId> = {
  openai: "openai-responses",
  "openai-responses": "openai-responses",
  compatible: "openai-compatible",
  "openai-compatible": "openai-compatible",
};

const providerLabels: Record<TranslationProviderId, string> = {
  "openai-responses": "OpenAI Responses",
  "openai-compatible": "OpenAI-compatible API",
};

const cleanBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const timeoutMs = () => {
  const parsed = Number(process.env.TRANSLATION_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed >= 10_000 && parsed <= 120_000 ? Math.round(parsed) : 110_000;
};

export type TranslationProviderState = {
  configured: boolean;
  provider: TranslationProviderId | null;
  providerLabel: string;
  model: string;
  baseUrl: string;
  responseFormat: TranslationResponseFormat;
  error: string | null;
};

export function getTranslationProviderState(): TranslationProviderState {
  const requested = (process.env.TRANSLATION_PROVIDER || "openai-responses").trim().toLowerCase();
  const provider = providerAliases[requested] ?? null;
  if (!provider) {
    return {
      configured: false,
      provider: null,
      providerLabel: requested || "未知 Provider",
      model: "",
      baseUrl: "",
      responseFormat: "json_schema",
      error: `不支持的 TRANSLATION_PROVIDER：${requested}`,
    };
  }

  const openAIProvider = provider === "openai-responses";
  const apiKey = process.env.TRANSLATION_API_KEY?.trim()
    || (openAIProvider ? process.env.OPENAI_API_KEY?.trim() : "")
    || "";
  const baseUrl = cleanBaseUrl(
    process.env.TRANSLATION_API_BASE_URL
      || (openAIProvider ? "https://api.openai.com/v1" : ""),
  );
  const model = process.env.TRANSLATION_MODEL?.trim()
    || (openAIProvider ? process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-5.6-sol" : "");
  const responseFormat = process.env.TRANSLATION_RESPONSE_FORMAT === "json_object" ? "json_object" : "json_schema";

  const missing = [
    !apiKey ? "TRANSLATION_API_KEY" : null,
    !baseUrl ? "TRANSLATION_API_BASE_URL" : null,
    !model ? "TRANSLATION_MODEL" : null,
  ].filter(Boolean);

  return {
    configured: missing.length === 0,
    provider,
    providerLabel: providerLabels[provider],
    model,
    baseUrl,
    responseFormat,
    error: missing.length ? `缺少配置：${missing.join("、")}` : null,
  };
}

export function getTranslationProviderConfig(): TranslationProviderConfig {
  const state = getTranslationProviderState();
  if (!state.configured || !state.provider) {
    throw new Error(state.error || "翻译 Provider 尚未配置完整。");
  }
  const openAIProvider = state.provider === "openai-responses";
  const apiKey = process.env.TRANSLATION_API_KEY?.trim()
    || (openAIProvider ? process.env.OPENAI_API_KEY?.trim() : "")
    || "";
  return {
    id: state.provider,
    label: state.providerLabel,
    apiKey,
    baseUrl: state.baseUrl,
    model: state.model,
    timeoutMs: timeoutMs(),
    responseFormat: state.responseFormat,
  };
}

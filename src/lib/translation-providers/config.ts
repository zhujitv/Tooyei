import "server-only";

import type {
  TranslationProviderConfig,
  TranslationProviderId,
  TranslationResponseFormat,
} from "@/lib/translation-providers/types";
import { translationProviderIds } from "@/lib/translation-providers/types";

const providerAliases: Record<string, TranslationProviderId> = {
  openai: "openai-responses",
  "openai-responses": "openai-responses",
  compatible: "openai-compatible",
  "openai-compatible": "openai-compatible",
  doubao: "volcengine-doubao",
  volcengine: "volcengine-doubao",
  "volcengine-doubao": "volcengine-doubao",
};

const providerLabels: Record<TranslationProviderId, string> = {
  "openai-responses": "OpenAI Responses",
  "openai-compatible": "OpenAI-compatible API",
  "volcengine-doubao": "火山引擎（豆包）· OpenAI SDK",
};

const cleanBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const parseTimeoutMs = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 10_000 && parsed <= 120_000 ? Math.round(parsed) : 110_000;
};

const parseResponseFormat = (
  value: string | undefined,
  fallback: TranslationResponseFormat,
): TranslationResponseFormat => value === "json_object" || value === "json_schema" ? value : fallback;

export const resolveTranslationProviderId = (value: string | undefined | null): TranslationProviderId | null => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return providerAliases[normalized] ?? null;
};

const defaultProviderValue = () => (process.env.TRANSLATION_PROVIDER || "openai-responses").trim().toLowerCase();

type ResolvedProviderValues = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  responseFormat: TranslationResponseFormat;
};

const genericValue = (provider: TranslationProviderId, value: string | undefined) =>
  resolveTranslationProviderId(defaultProviderValue()) === provider ? value?.trim() || "" : "";

const resolveProviderValues = (provider: TranslationProviderId): ResolvedProviderValues => {
  switch (provider) {
    case "openai-responses":
      return {
        apiKey: genericValue(provider, process.env.TRANSLATION_API_KEY) || process.env.OPENAI_API_KEY?.trim() || "",
        baseUrl: cleanBaseUrl(genericValue(provider, process.env.TRANSLATION_API_BASE_URL) || "https://api.openai.com/v1"),
        model: genericValue(provider, process.env.TRANSLATION_MODEL) || process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-5.6-sol",
        timeoutMs: parseTimeoutMs(genericValue(provider, process.env.TRANSLATION_REQUEST_TIMEOUT_MS)),
        responseFormat: "json_schema",
      };
    case "openai-compatible":
      return {
        apiKey: genericValue(provider, process.env.TRANSLATION_API_KEY) || process.env.OPENAI_COMPATIBLE_API_KEY?.trim() || "",
        baseUrl: cleanBaseUrl(genericValue(provider, process.env.TRANSLATION_API_BASE_URL) || process.env.OPENAI_COMPATIBLE_BASE_URL || ""),
        model: genericValue(provider, process.env.TRANSLATION_MODEL) || process.env.OPENAI_COMPATIBLE_MODEL?.trim() || "",
        timeoutMs: parseTimeoutMs(genericValue(provider, process.env.TRANSLATION_REQUEST_TIMEOUT_MS)),
        responseFormat: parseResponseFormat(
          genericValue(provider, process.env.TRANSLATION_RESPONSE_FORMAT) || process.env.OPENAI_COMPATIBLE_RESPONSE_FORMAT,
          "json_object",
        ),
      };
    case "volcengine-doubao":
      return {
        apiKey: genericValue(provider, process.env.TRANSLATION_API_KEY)
          || process.env.DOUBAO_API_KEY?.trim()
          || process.env.ARK_API_KEY?.trim()
          || "",
        baseUrl: cleanBaseUrl(
          genericValue(provider, process.env.TRANSLATION_API_BASE_URL)
            || process.env.DOUBAO_API_BASE_URL
            || "https://ark.cn-beijing.volces.com/api/v3",
        ),
        model: genericValue(provider, process.env.TRANSLATION_MODEL)
          || process.env.DOUBAO_MODEL?.trim()
          || "doubao-seed-2-0-lite-260215",
        timeoutMs: parseTimeoutMs(
          genericValue(provider, process.env.TRANSLATION_REQUEST_TIMEOUT_MS)
            || process.env.DOUBAO_REQUEST_TIMEOUT_MS,
        ),
        responseFormat: parseResponseFormat(
          genericValue(provider, process.env.TRANSLATION_RESPONSE_FORMAT)
            || process.env.DOUBAO_RESPONSE_FORMAT,
          "json_object",
        ),
      };
  }
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

export function getTranslationProviderState(requestedProvider?: string): TranslationProviderState {
  const requested = requestedProvider?.trim().toLowerCase() || defaultProviderValue();
  const provider = resolveTranslationProviderId(requested);
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

  const values = resolveProviderValues(provider);

  const missing = [
    !values.apiKey ? provider === "volcengine-doubao" ? "DOUBAO_API_KEY" : "API Key" : null,
    !values.baseUrl ? "API Base URL" : null,
    !values.model ? provider === "volcengine-doubao" ? "DOUBAO_MODEL" : "Model" : null,
  ].filter(Boolean);

  return {
    configured: missing.length === 0,
    provider,
    providerLabel: providerLabels[provider],
    model: values.model,
    baseUrl: values.baseUrl,
    responseFormat: values.responseFormat,
    error: missing.length ? `缺少配置：${missing.join("、")}` : null,
  };
}

export function getTranslationProviderStates(): TranslationProviderState[] {
  return translationProviderIds.map((provider) => getTranslationProviderState(provider));
}

export function getTranslationProviderConfig(requestedProvider?: string): TranslationProviderConfig {
  const state = getTranslationProviderState(requestedProvider);
  if (!state.configured || !state.provider) {
    throw new Error(state.error || "翻译 Provider 尚未配置完整。");
  }
  const values = resolveProviderValues(state.provider);
  return {
    id: state.provider,
    label: state.providerLabel,
    apiKey: values.apiKey,
    baseUrl: state.baseUrl,
    model: state.model,
    timeoutMs: values.timeoutMs,
    responseFormat: state.responseFormat,
  };
}

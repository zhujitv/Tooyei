import "server-only";

import type {
  TranslationProviderConfig,
  TranslationProviderId,
  TranslationResponseFormat,
} from "@/lib/translation-providers/types";
import { productTranslationProviderId } from "@/lib/translation-providers/types";
import { translationWorkerConfig } from "@/lib/translation-worker-config";

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
  "volcengine-doubao": "火山引擎豆包大模型",
};

const cleanBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const parseTimeoutMs = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 10_000
    ? Math.min(Math.round(parsed), translationWorkerConfig.providerTimeoutMs)
    : translationWorkerConfig.providerTimeoutMs;
};

const parseResponseFormat = (
  value: string | undefined,
  fallback: TranslationResponseFormat,
): TranslationResponseFormat => value === "json_object" || value === "json_schema" ? value : fallback;

export const resolveTranslationProviderId = (value: string | undefined | null): TranslationProviderId | null => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return providerAliases[normalized] ?? null;
};

const defaultProviderValue = () => productTranslationProviderId;

type ResolvedProviderValues = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  responseFormat: TranslationResponseFormat;
};

const resolveProviderValues = (provider: TranslationProviderId): ResolvedProviderValues => {
  switch (provider) {
    case "openai-responses":
      return {
        apiKey: process.env.OPENAI_API_KEY?.trim() || "",
        baseUrl: "https://api.openai.com/v1",
        model: process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-5.6-sol",
        timeoutMs: parseTimeoutMs(undefined),
        responseFormat: "json_schema",
      };
    case "openai-compatible":
      return {
        apiKey: process.env.OPENAI_COMPATIBLE_API_KEY?.trim() || "",
        baseUrl: cleanBaseUrl(process.env.OPENAI_COMPATIBLE_BASE_URL || ""),
        model: process.env.OPENAI_COMPATIBLE_MODEL?.trim() || "",
        timeoutMs: parseTimeoutMs(undefined),
        responseFormat: parseResponseFormat(
          process.env.OPENAI_COMPATIBLE_RESPONSE_FORMAT,
          "json_object",
        ),
      };
    case "volcengine-doubao":
      return {
        apiKey: process.env.DOUBAO_API_KEY?.trim()
          || process.env.ARK_API_KEY?.trim()
          || "",
        baseUrl: cleanBaseUrl(
          process.env.DOUBAO_API_BASE_URL
            || "https://ark.cn-beijing.volces.com/api/v3",
        ),
        model: process.env.DOUBAO_MODEL?.trim()
          || "doubao-seed-2-0-lite-260215",
        timeoutMs: parseTimeoutMs(
          process.env.DOUBAO_REQUEST_TIMEOUT_MS,
        ),
        responseFormat: parseResponseFormat(
          process.env.DOUBAO_RESPONSE_FORMAT,
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

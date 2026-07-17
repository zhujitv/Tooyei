import "server-only";

import { getTranslationProviderConfig } from "@/lib/translation-providers/config";
import { OpenAICompatibleProvider } from "@/lib/translation-providers/openai-compatible";
import { OpenAIResponsesProvider } from "@/lib/translation-providers/openai-responses";
import type { TranslationProvider } from "@/lib/translation-providers/types";

export function getTranslationProvider(requestedProvider?: string): TranslationProvider {
  const config = getTranslationProviderConfig(requestedProvider);
  switch (config.id) {
    case "openai-responses":
      return new OpenAIResponsesProvider(config);
    case "openai-compatible":
    case "volcengine-doubao":
      return new OpenAICompatibleProvider(config);
  }
}

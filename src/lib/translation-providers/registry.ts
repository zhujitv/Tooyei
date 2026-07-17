import "server-only";

import { getTranslationProviderConfig } from "@/lib/translation-providers/config";
import { OpenAICompatibleProvider } from "@/lib/translation-providers/openai-compatible";
import { OpenAIResponsesProvider } from "@/lib/translation-providers/openai-responses";
import type { TranslationProvider } from "@/lib/translation-providers/types";

export function getTranslationProvider(): TranslationProvider {
  const config = getTranslationProviderConfig();
  switch (config.id) {
    case "openai-responses":
      return new OpenAIResponsesProvider(config);
    case "openai-compatible":
      return new OpenAICompatibleProvider(config);
  }
}

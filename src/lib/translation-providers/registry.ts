import "server-only";

import { getTranslationProviderConfig } from "@/lib/translation-providers/config";
import { DoubaoTranslationProvider } from "@/lib/translation-providers/doubao-translation";
import { isDoubaoTranslationModel } from "@/lib/translation-providers/doubao-translation-document";
import { OpenAICompatibleProvider } from "@/lib/translation-providers/openai-compatible";
import { OpenAIResponsesProvider } from "@/lib/translation-providers/openai-responses";
import type { TranslationProvider } from "@/lib/translation-providers/types";

export function getTranslationProvider(requestedProvider?: string, recordedModel?: string): TranslationProvider {
  const config = getTranslationProviderConfig(requestedProvider, recordedModel);
  switch (config.id) {
    case "openai-responses":
      return new OpenAIResponsesProvider(config);
    case "openai-compatible":
      return new OpenAICompatibleProvider(config);
    case "volcengine-doubao":
      return isDoubaoTranslationModel(config.model)
        ? new DoubaoTranslationProvider(config)
        : new OpenAICompatibleProvider(config);
  }
}

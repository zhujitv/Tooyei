import "server-only";

import { createHash } from "node:crypto";
import { Locale } from "@/generated/prisma/client";
import { normalizeArticleContent, type ArticleContent } from "@/lib/article-content";
import { validateArticleSource } from "@/lib/article-publication";
import { getPrisma } from "@/lib/db";
import { getBuildingMaterialsGlossaryTerms } from "@/lib/translation-glossary";
import { getTranslationProviderState } from "@/lib/translation-providers/config";
import { getTranslationProvider } from "@/lib/translation-providers/registry";
import { normalizeTranslationResult, parseTranslationResponse, readTranslationString } from "@/lib/translation-response-parser";

const localeNames: Record<Locale, string> = {
  EN: "English", DE: "German", FR: "French", ES: "Spanish", RU: "Russian",
  JA: "Japanese", IT: "Italian", AR: "Arabic", ZH: "Simplified Chinese",
  PT: "Portuguese", NL: "Dutch", PL: "Polish", TR: "Turkish", RO: "Romanian", CS: "Czech",
};

const stringProperty = { type: "string" } as const;
const emptyArrayProperty = {
  type: "array",
  items: { type: "object", properties: {}, required: [], additionalProperties: false },
} as const;
const articleTranslationJsonSchema = {
  type: "object",
  properties: {
    product: {
      type: "object",
      properties: { title: stringProperty, summary: stringProperty, seoTitle: stringProperty, seoDescription: stringProperty },
      required: ["title", "summary", "seoTitle", "seoDescription"],
      additionalProperties: false,
    },
    media: emptyArrayProperty,
    features: {
      type: "array",
      items: {
        type: "object",
        properties: { id: stringProperty, title: stringProperty, description: stringProperty },
        required: ["id", "title", "description"],
        additionalProperties: false,
      },
    },
    specifications: emptyArrayProperty,
    applications: emptyArrayProperty,
    downloads: emptyArrayProperty,
  },
  required: ["product", "media", "features", "specifications", "applications", "downloads"],
  additionalProperties: false,
} as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

export class ArticleTranslationError extends Error {
  constructor(
    message: string,
    readonly code = "ARTICLE_TRANSLATION_FAILED",
    readonly rawResponse: string | null = null,
  ) {
    super(message);
    this.name = "ArticleTranslationError";
  }
}

export type GeneratedArticleTranslation = {
  output: {
    title: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    content: ArticleContent;
  };
  inputHash: string;
  responseId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  rawResponse: string;
  warnings: string[];
  sourceTranslationId: string;
  sourceUpdatedAt: Date;
};

export async function generateArticleTranslation(input: {
  articleId: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  provider: string;
  model: string;
}): Promise<GeneratedArticleTranslation> {
  if (input.sourceLocale !== Locale.EN) throw new ArticleTranslationError("文章翻译必须使用英文（EN）作为源语言。", "INVALID_SOURCE_LOCALE");
  if (input.targetLocale === Locale.EN) throw new ArticleTranslationError("英文是源语言，不能作为自动翻译目标。", "INVALID_TARGET_LOCALE");

  const source = await getPrisma().articleTranslation.findUnique({
    where: { articleId_locale: { articleId: input.articleId, locale: Locale.EN } },
    select: { id: true, title: true, excerpt: true, content: true, seoTitle: true, seoDescription: true, updatedAt: true },
  });
  const validation = validateArticleSource(source);
  if (!source || !validation.ok) {
    throw new ArticleTranslationError(
      `英文源内容不完整：${validation.missingFields.join("、") || "英文内容未创建"}`,
      "ENGLISH_SOURCE_INCOMPLETE",
    );
  }

  const content = normalizeArticleContent(source.content);
  const providerDocument = {
    product: {
      title: source.title.trim(),
      summary: source.excerpt?.trim() || "",
      seoTitle: source.seoTitle?.trim() || "",
      seoDescription: source.seoDescription?.trim() || "",
    },
    media: [],
    features: content.blocks.map((block) => ({ id: block.id, title: "", description: block.text })),
    specifications: [],
    applications: [],
    downloads: [],
  };
  const sourceJson = JSON.stringify(providerDocument);
  const state = getTranslationProviderState(input.provider, input.model);
  if (!state.configured || !state.provider) throw new ArticleTranslationError(state.error || "翻译 Provider 尚未配置。", "PROVIDER_NOT_CONFIGURED");
  const inputHash = createHash("sha256")
    .update(`${state.provider}:${state.model}:${input.sourceLocale}:${input.targetLocale}:${sourceJson}`)
    .digest("hex");
  const generated = await getTranslationProvider(state.provider, state.model).generateStructured({
    systemPrompt: [
      `Translate this B2B flooring article from ${localeNames[input.sourceLocale]} to ${localeNames[input.targetLocale]}.`,
      "Preserve TOOYEI, technical terms, numbers, units, standards, URLs and every block id exactly.",
      "Do not add claims, certifications or facts absent from the source.",
      "Translate every visitor-facing field naturally for international architects, distributors, importers and project buyers.",
      "Return the same JSON structure only. For Arabic use Modern Standard Arabic; for Chinese use Simplified Chinese.",
    ].join(" "),
    sourceJson,
    schemaName: "tooyei_article_translation",
    schema: articleTranslationJsonSchema,
    maxOutputTokens: 12000,
    sourceLanguage: input.sourceLocale.toLowerCase(),
    targetLanguage: input.targetLocale.toLowerCase(),
    glossaryTerms: getBuildingMaterialsGlossaryTerms(sourceJson, input.targetLocale),
  });

  const normalized = normalizeTranslationResult(parseTranslationResponse(generated.outputText));
  const translatedFeatures = normalized.features.map(asRecord).filter((row): row is Record<string, unknown> => Boolean(row));
  const warnings = [...generated.warnings];
  const translatedBlocks = content.blocks.map((block) => {
    const row = translatedFeatures.find((item) => readTranslationString(item, ["id"]) === block.id);
    const text = row ? readTranslationString(row, ["description", "title"]).trim() : "";
    if (!text) warnings.push(`正文块 ${block.id} 缺少译文。`);
    return { ...block, text };
  });
  const output = {
    title: normalized.product.title.trim(),
    excerpt: normalized.product.summary.trim(),
    seoTitle: normalized.product.seoTitle.trim(),
    seoDescription: normalized.product.seoDescription.trim(),
    content: { version: 1 as const, blocks: translatedBlocks },
  };
  const outputValidation = validateArticleSource(output);
  if (!outputValidation.ok) {
    throw new ArticleTranslationError(
      `模型译文缺少：${outputValidation.missingFields.join("、")}`,
      "INVALID_MODEL_OUTPUT",
      generated.outputText,
    );
  }

  return {
    output,
    inputHash,
    responseId: generated.responseId,
    promptTokens: generated.promptTokens,
    completionTokens: generated.completionTokens,
    totalTokens: generated.totalTokens,
    rawResponse: generated.outputText,
    warnings,
    sourceTranslationId: source.id,
    sourceUpdatedAt: source.updatedAt,
  };
}

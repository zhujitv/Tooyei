import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { Locale } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getTranslationProviderState } from "@/lib/translation-providers/config";
import { getTranslationProvider } from "@/lib/translation-providers/registry";
import {
  getTranslationResultQcWarnings,
  normalizeTranslationResult,
  parseTranslationResponse,
  readTranslationString,
  TranslationResponseParseError,
} from "@/lib/translation-response-parser";

export const productTranslationPromptVersion = "tooyei-product-json-v3";

export class TranslationBusinessError extends Error {
  readonly name = "TranslationBusinessError";
  readonly errorType = "BUSINESS";
  readonly retryable = false;
}

export class TranslationResponseValidationError extends Error {
  readonly name = "TranslationResponseValidationError";
  readonly errorType = "RESPONSE_VALIDATION";
  readonly retryable = true;

  constructor(
    message: string,
    readonly rawResponse: string,
    readonly responseId: string | null,
    readonly promptTokens: number | null,
    readonly completionTokens: number | null,
    readonly totalTokens: number | null,
  ) {
    super(message);
  }
}

const localeNames: Record<Locale, string> = {
  ZH: "Simplified Chinese", EN: "English", DE: "German", FR: "French", ES: "Spanish",
  RU: "Russian", JA: "Japanese", IT: "Italian", AR: "Arabic", PT: "Portuguese",
  NL: "Dutch", PL: "Polish", TR: "Turkish", RO: "Romanian", CS: "Czech",
};

const textItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(180),
  description: z.string().max(1200),
});

const productTranslationProductSchema = z.object({
  title: z.string().trim().max(180),
  summary: z.string().trim().max(800),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(180),
});

export const productTranslationOutputSchema = z.object({
  product: productTranslationProductSchema,
  media: z.array(z.object({ id: z.string().min(1), alt: z.string().max(240), caption: z.string().max(500) })),
  features: z.array(textItemSchema),
  specifications: z.array(z.object({
    id: z.string().min(1),
    group: z.string().max(120),
    label: z.string().max(180),
    displayValue: z.string().max(500),
  })),
  applications: z.array(z.object({
    id: z.string().min(1),
    title: z.string().max(180),
    description: z.string().max(1200),
    imageAlt: z.string().max(240),
  })),
  downloads: z.array(textItemSchema),
});

export type ProductTranslationOutput = z.infer<typeof productTranslationOutputSchema>;

const stringProperty = { type: "string" } as const;
const arrayOf = (properties: Record<string, unknown>, required: string[]) => ({
  type: "array",
  items: { type: "object", properties, required, additionalProperties: false },
});

const productTranslationJsonSchema = {
  type: "object",
  properties: {
    product: {
      type: "object",
      properties: {
        title: stringProperty,
        summary: stringProperty,
        seoTitle: stringProperty,
        seoDescription: stringProperty,
      },
      required: ["title", "summary", "seoTitle", "seoDescription"],
      additionalProperties: false,
    },
    media: arrayOf({ id: stringProperty, alt: stringProperty, caption: stringProperty }, ["id", "alt", "caption"]),
    features: arrayOf({ id: stringProperty, title: stringProperty, description: stringProperty }, ["id", "title", "description"]),
    specifications: arrayOf(
      { id: stringProperty, group: stringProperty, label: stringProperty, displayValue: stringProperty },
      ["id", "group", "label", "displayValue"],
    ),
    applications: arrayOf(
      { id: stringProperty, title: stringProperty, description: stringProperty, imageAlt: stringProperty },
      ["id", "title", "description", "imageAlt"],
    ),
    downloads: arrayOf({ id: stringProperty, title: stringProperty, description: stringProperty }, ["id", "title", "description"]),
  },
  required: [
    "product", "media", "features",
    "specifications", "applications", "downloads",
  ],
  additionalProperties: false,
} as const;

const preferredTranslation = <T extends { locale: Locale }>(rows: T[], locale: Locale) => {
  const priorities = Array.from(new Set([locale, Locale.EN, Locale.ZH]));
  return priorities.map((candidate) => rows.find((row) => row.locale === candidate)).find(Boolean);
};

const numericTokens = (value: string) => value.match(/\d+(?:[.,]\d+)?/g) ?? [];
const equalIds = (source: Array<{ id: string }>, output: Array<{ id: string }>) => {
  const left = source.map(({ id }) => id).sort();
  const right = output.map(({ id }) => id).sort();
  return left.length === right.length && left.every((id, index) => id === right[index]);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const normalizeStructuredItems = (
  value: unknown,
  sourceItems: Array<{ id: string }>,
  fields: Record<string, readonly string[]>,
  label: string,
  warnings: string[],
) => {
  const rows = Array.isArray(value) ? value.map(asRecord).filter((row): row is Record<string, unknown> => Boolean(row)) : [];
  if (!Array.isArray(value)) warnings.push(`模型响应缺少${label}数组，已按源内容补齐空字符串。`);

  const rowsById = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const id = readTranslationString(row, ["id"]);
    if (id && !rowsById.has(id)) rowsById.set(id, row);
  }

  let missingItems = 0;
  const missingFields = new Set<string>();
  const normalized = sourceItems.map((sourceItem) => {
    const row = rowsById.get(sourceItem.id);
    if (!row) missingItems += 1;
    const item: Record<string, string> = { id: sourceItem.id };
    for (const [field, aliases] of Object.entries(fields)) {
      if (!row || !aliases.some((alias) => Object.hasOwn(row, alias))) missingFields.add(field);
      item[field] = row ? readTranslationString(row, aliases) : "";
    }
    return item;
  });

  if (missingItems) warnings.push(`${label}缺少 ${missingItems} 个源项目，已保留 ID 并使用空字符串。`);
  if (missingFields.size) warnings.push(`${label}存在缺失字段：${Array.from(missingFields).join("、")}；已使用空字符串。`);
  const extraItems = rows.filter((row) => {
    const id = readTranslationString(row, ["id"]);
    return id && !sourceItems.some((item) => item.id === id);
  }).length;
  if (extraItems) warnings.push(`${label}返回了 ${extraItems} 个未知 ID，已忽略以避免写入错误记录。`);
  return normalized;
};

export type GeneratedProductTranslation = {
  output: ProductTranslationOutput;
  inputHash: string;
  responseId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  rawResponse: string;
  promptVersion: string;
  warnings: string[];
};

export async function generateProductTranslation(
  productId: string,
  sourceLocale: Locale,
  targetLocale: Locale,
  expected?: { provider: string; model: string },
): Promise<GeneratedProductTranslation> {
  if (sourceLocale === targetLocale) throw new TranslationBusinessError("源语言和目标语言不能相同。");
  const state = getTranslationProviderState(expected?.provider);
  if (!state.configured || !state.provider) throw new TranslationBusinessError(state.error || "翻译 Provider 尚未配置完整。");
  if (expected && expected.model !== state.model) {
    throw new TranslationBusinessError(`任务使用 ${expected.provider} / ${expected.model}，该 Provider 当前模型为 ${state.model}；请恢复模型配置或新建任务。`);
  }

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      sku: true,
      kind: true,
      translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } },
      media: {
        orderBy: { sortOrder: "asc" },
        select: { assetId: true, alt: true, caption: true, translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } } },
      },
      features: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } } },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, group: true, value: true, unit: true, translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } } },
      },
      applications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } } },
      },
      downloads: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, kind: true, translations: { where: { locale: { in: [sourceLocale, Locale.EN, Locale.ZH] } } } },
      },
    },
  });
  if (!product) throw new TranslationBusinessError("产品不存在或已被删除。");

  const main = product.translations.find(({ locale }) => locale === sourceLocale);
  if (!main?.title.trim() || !main.summary.trim()) {
    throw new TranslationBusinessError(`产品 ${product.sku} 缺少完整的 ${localeNames[sourceLocale]} 源语言标题或摘要。`);
  }

  const source = {
    product: {
      slug: product.slug,
      sku: product.sku,
      kind: product.kind,
      title: main.title,
      summary: main.summary,
      seoTitle: main.seoTitle ?? "",
      seoDescription: main.seoDescription ?? "",
    },
    media: product.media.map((item) => {
      const translation = preferredTranslation(item.translations, sourceLocale);
      return { id: item.assetId, alt: translation?.alt ?? item.alt ?? "", caption: translation?.caption ?? item.caption ?? "" };
    }),
    features: product.features.map((item) => {
      const translation = preferredTranslation(item.translations, sourceLocale);
      return { id: item.id, title: translation?.value ?? "", description: translation?.description ?? "" };
    }),
    specifications: product.specifications.map((item) => {
      const translation = preferredTranslation(item.translations, sourceLocale);
      return {
        id: item.id,
        group: translation?.group ?? item.group ?? "",
        label: translation?.label ?? "",
        displayValue: translation?.displayValue ?? [item.value, item.unit].filter(Boolean).join(" "),
      };
    }),
    applications: product.applications.map((item) => {
      const translation = preferredTranslation(item.translations, sourceLocale);
      return { id: item.id, title: translation?.title ?? "", description: translation?.description ?? "", imageAlt: translation?.imageAlt ?? "" };
    }),
    downloads: product.downloads.map((item) => {
      const translation = preferredTranslation(item.translations, sourceLocale);
      return { id: item.id, kind: item.kind, title: translation?.title ?? "", description: translation?.description ?? "" };
    }),
  };

  const sourceJson = JSON.stringify(source);
  const inputHash = createHash("sha256")
    .update(`${state.provider}:${state.model}:${sourceLocale}:${targetLocale}:${sourceJson}`)
    .digest("hex");
  const systemPrompt = [
    `You are a senior localization editor for an international flooring manufacturer. Translate the supplied product content from ${localeNames[sourceLocale]} (${sourceLocale.toLowerCase()}) to ${localeNames[targetLocale]} (${targetLocale.toLowerCase()}).`,
    "Return professional native-language B2B copy suitable for architects, distributors, importers, and project buyers.",
    "Preserve the brand TOOYEI, SKU, model identifiers, technical meanings, all numbers, dimensions, standards, percentages, units, URLs, and item IDs exactly.",
    "Do not invent certifications, performance claims, warranties, applications, materials, or technical facts that are absent from the source.",
    "Translate every supplied visitor-facing field. Empty source fields must remain empty. Return every array item exactly once with the same id.",
    "Write a concise SEO title no longer than 70 characters and an accurate SEO description no longer than 180 characters in the target language.",
    "For Arabic, use natural Modern Standard Arabic. For Chinese, use Simplified Chinese. For Japanese, use natural Japanese industry terminology.",
    "Return one valid JSON object only. Do not return Markdown, explanations, headings, comments, or ```json fences.",
    "Return the translated title, summary, seoTitle, and seoDescription inside the product object. Keep media, features, specifications, applications, and downloads as root arrays.",
    "Do not rename or omit fields. Every schema field must be present and every field value defined as a string must be a JSON string.",
  ].join(" ");
  const generated = await getTranslationProvider(state.provider).generateStructured({
    systemPrompt,
    sourceJson,
    schemaName: "tooyei_product_translation",
    schema: productTranslationJsonSchema,
    maxOutputTokens: 12000,
  });
  let parsed: Record<string, unknown>;
  try {
    parsed = parseTranslationResponse(generated.outputText);
  } catch (error) {
    if (error instanceof TranslationResponseParseError) {
      throw error.withContext({
        responseId: generated.responseId,
        promptTokens: generated.promptTokens,
        completionTokens: generated.completionTokens,
        totalTokens: generated.totalTokens,
      });
    }
    throw error;
  }

  const rawResult = parsed;
  const normalizedResult = normalizeTranslationResult(rawResult);
  const warnings = getTranslationResultQcWarnings(normalizedResult);
  const normalized = {
    product: normalizedResult.product,
    media: normalizeStructuredItems(normalizedResult.media, source.media, {
      alt: ["alt"], caption: ["caption"],
    }, "媒体", warnings),
    features: normalizeStructuredItems(normalizedResult.features, source.features, {
      title: ["title", "value", "name"], description: ["description", "summary"],
    }, "卖点", warnings),
    specifications: normalizeStructuredItems(normalizedResult.specifications, source.specifications, {
      group: ["group"], label: ["label", "name", "title"], displayValue: ["displayValue", "display_value", "value"],
    }, "参数", warnings),
    applications: normalizeStructuredItems(normalizedResult.applications, source.applications, {
      title: ["title", "name"], description: ["description", "summary"], imageAlt: ["imageAlt", "image_alt", "alt"],
    }, "应用场景", warnings),
    downloads: normalizeStructuredItems(normalizedResult.downloads, source.downloads, {
      title: ["title", "name"], description: ["description", "summary"],
    }, "下载资料", warnings),
  };

  console.log("Raw AI Response", rawResult);
  console.log("Normalized Response", normalized);
  console.log("Product", normalized.product);
  console.log("Title", normalized.product.title);
  console.log("Summary", normalized.product.summary);
  console.log("SeoTitle", normalized.product.seoTitle);

  const validated = productTranslationOutputSchema.safeParse(normalized);
  if (!validated.success) {
    throw new TranslationResponseValidationError(
      `模型响应字段标准化后仍未通过校验：${z.prettifyError(validated.error)}`,
      generated.outputText,
      generated.responseId,
      generated.promptTokens,
      generated.completionTokens,
      generated.totalTokens,
    );
  }
  const output = validated.data;

  const structuredPairs = [
    ["媒体", source.media, output.media],
    ["卖点", source.features, output.features],
    ["参数", source.specifications, output.specifications],
    ["应用场景", source.applications, output.applications],
    ["下载资料", source.downloads, output.downloads],
  ] as const;
  for (const [label, inputItems, outputItems] of structuredPairs) {
    if (!equalIds(inputItems, outputItems)) throw new TranslationBusinessError(`${label}的项目 ID 与源内容不一致，已阻止写入。`);
  }

  for (const sourceItem of source.specifications) {
    const translated = output.specifications.find(({ id }) => id === sourceItem.id);
    if (translated && numericTokens(sourceItem.displayValue).join("|") !== numericTokens(translated.displayValue).join("|")) {
      warnings.push(`参数“${sourceItem.label || sourceItem.id}”中的数字可能发生变化，请人工核对。`);
    }
  }

  return {
    output,
    inputHash,
    responseId: generated.responseId,
    promptTokens: generated.promptTokens,
    completionTokens: generated.completionTokens,
    totalTokens: generated.totalTokens,
    rawResponse: generated.outputText,
    promptVersion: productTranslationPromptVersion,
    warnings,
  };
}

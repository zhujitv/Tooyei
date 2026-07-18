import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { Locale } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  buildBuildingMaterialsGlossaryPrompt,
  getBuildingMaterialsGlossaryTerms,
} from "@/lib/translation-glossary";
import { getTranslationProviderState } from "@/lib/translation-providers/config";
import { getTranslationProvider } from "@/lib/translation-providers/registry";
import type { TranslationProcessingStep } from "@/lib/translation-worker-config";
import { hasTranslationContentType, translationContentTypes } from "@/lib/translation-worker-config";
import {
  getTranslationResultQcWarnings,
  normalizeTranslationResult,
  parseTranslationResponse,
  readTranslationString,
  TranslationResponseParseError,
} from "@/lib/translation-response-parser";
import {
  isSpecificationValueTranslatable,
  TRANSLATION_QA_VERSION,
  validateProductTranslation,
  type TranslationQaDocument,
  type TranslationQaIssue,
  type TranslationQaResult,
} from "@/lib/translation/quality";

export const SOURCE_LOCALE = Locale.EN;
export const productTranslationPromptVersion = "tooyei-product-json-v5-qa";

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

export class TranslationQualityError extends Error {
  readonly name = "TranslationQualityError";
  readonly errorType = "QA_VALIDATION";
  readonly retryable = true;

  constructor(
    message: string,
    readonly qa: TranslationQaResult,
    readonly output: ProductTranslationOutput,
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
  seoTitle: z.string().trim().max(200),
  seoDescription: z.string().trim().max(1000),
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

const sourceTranslation = <T extends { locale: Locale }>(rows: T[]) => rows.find((row) => row.locale === SOURCE_LOCALE);

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
  qa: TranslationQaResult;
  qaVersion: string;
};

export async function generateProductTranslation(
  productId: string,
  sourceLocale: Locale,
  targetLocale: Locale,
  expected?: { provider: string; model: string; contentTypes?: readonly string[]; retryFeedback?: string[] },
  onStep?: (step: Extract<TranslationProcessingStep, "GET_CONTENT" | "BUILD_PROMPT" | "CALL_MODEL" | "QUALITY_CHECK">) => Promise<void>,
): Promise<GeneratedProductTranslation> {
  if (sourceLocale === targetLocale) throw new TranslationBusinessError("源语言和目标语言不能相同。");
  if (sourceLocale !== SOURCE_LOCALE) throw new TranslationBusinessError("产品自动翻译必须使用英文（EN）作为唯一源语言。");
  if (targetLocale === SOURCE_LOCALE) throw new TranslationBusinessError("英文是源语言，不参与自动翻译。");
  const state = getTranslationProviderState(expected?.provider, expected?.model);
  if (!state.configured || !state.provider) throw new TranslationBusinessError(state.error || "翻译 Provider 尚未配置完整。");

  await onStep?.("GET_CONTENT");
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      sku: true,
      kind: true,
      translations: { where: { locale: SOURCE_LOCALE } },
      media: {
        orderBy: { sortOrder: "asc" },
        select: { assetId: true, alt: true, caption: true, translations: { where: { locale: SOURCE_LOCALE } } },
      },
      features: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: SOURCE_LOCALE } } },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, group: true, value: true, unit: true, translations: { where: { locale: SOURCE_LOCALE } } },
      },
      applications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: SOURCE_LOCALE } } },
      },
      downloads: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, kind: true, translations: { where: { locale: SOURCE_LOCALE } } },
      },
    },
  });
  if (!product) throw new TranslationBusinessError("产品不存在或已被删除。");

  const main = product.translations.find(({ locale }) => locale === SOURCE_LOCALE);
  if (!main?.title.trim() || !main.summary.trim()) {
    throw new TranslationBusinessError(`产品 ${product.sku} 缺少完整的英文源语言标题或摘要。`);
  }

  const requestedContentTypes = expected?.contentTypes?.length ? expected.contentTypes : translationContentTypes;
  const translatesProduct = requestedContentTypes.includes("PRODUCT");
  const translatesSeo = requestedContentTypes.includes("SEO");
  if (translatesSeo && (!main.seoTitle?.trim() || !main.seoDescription?.trim())) {
    throw new TranslationBusinessError(`产品 ${product.sku} 缺少英文 SEO 标题或 SEO 描述，不能创建 SEO 翻译。`);
  }
  const specificationPolicies = new Map(product.specifications.map((item) => {
    const translation = sourceTranslation(item.translations);
    // The unit is a separate system-owned field and is rendered separately.
    // Never send or persist it as part of displayValue, otherwise values such as
    // "7 mm" become "7 mm mm" on the public product page.
    const displayValue = translation?.displayValue?.trim() || item.value;
    return [item.id, { displayValue, translateValue: isSpecificationValueTranslatable(displayValue, item.unit) }] as const;
  }));
  const source: TranslationQaDocument = {
    product: {
      title: translatesProduct ? main.title : "",
      summary: translatesProduct ? main.summary : "",
      seoTitle: translatesSeo ? main.seoTitle ?? "" : "",
      seoDescription: translatesSeo ? main.seoDescription ?? "" : "",
    },
    media: requestedContentTypes.some((type) => type === "MEDIA_ALT" || type === "MEDIA_CAPTION") ? product.media.map((item) => {
      const translation = sourceTranslation(item.translations);
      return { id: item.assetId, alt: translation?.alt ?? item.alt ?? "", caption: translation?.caption ?? item.caption ?? "" };
    }) : [],
    features: requestedContentTypes.some((type) => type === "FEATURE" || type === "FEATURE_TITLE" || type === "FEATURE_DESCRIPTION") ? product.features.map((item) => {
      const translation = sourceTranslation(item.translations);
      return { id: item.id, title: translation?.value ?? "", description: translation?.description ?? "" };
    }) : [],
    specifications: requestedContentTypes.some((type) => type === "SPECIFICATION" || type === "SPEC_LABEL" || type === "SPEC_VALUE") ? product.specifications.map((item) => {
      const translation = sourceTranslation(item.translations);
      return {
        id: item.id,
        group: translation?.group ?? item.group ?? "",
        label: translation?.label ?? "",
        displayValue: specificationPolicies.get(item.id)?.displayValue ?? item.value,
      };
    }) : [],
    applications: requestedContentTypes.some((type) => type === "APPLICATION" || type === "APPLICATION_TITLE" || type === "APPLICATION_DESCRIPTION") ? product.applications.map((item) => {
      const translation = sourceTranslation(item.translations);
      return { id: item.id, title: translation?.title ?? "", description: translation?.description ?? "", imageAlt: translation?.imageAlt ?? "" };
    }) : [],
    downloads: requestedContentTypes.some((type) => type === "DOWNLOAD" || type === "DOWNLOAD_TITLE") ? product.downloads.map((item) => {
      const translation = sourceTranslation(item.translations);
      return { id: item.id, title: translation?.title ?? "", description: translation?.description ?? "" };
    }) : [],
  };

  const requiredSourceFields: Array<[boolean, string, string]> = [
    ...source.media.map((item) => [hasTranslationContentType(requestedContentTypes, "MEDIA_ALT"), `媒体 ${item.id} ALT`, item.alt] as [boolean, string, string]),
    ...source.features.map((item) => [hasTranslationContentType(requestedContentTypes, "FEATURE_TITLE"), `卖点 ${item.id} 标题`, item.title] as [boolean, string, string]),
    ...source.specifications.map((item) => [hasTranslationContentType(requestedContentTypes, "SPEC_LABEL"), `参数 ${item.id} 名称`, item.label] as [boolean, string, string]),
    ...source.applications.map((item) => [hasTranslationContentType(requestedContentTypes, "APPLICATION_TITLE"), `应用 ${item.id} 标题`, item.title] as [boolean, string, string]),
    ...source.downloads.map((item) => [hasTranslationContentType(requestedContentTypes, "DOWNLOAD_TITLE"), `下载资料 ${item.id} 标题`, item.title] as [boolean, string, string]),
  ];
  const missingSource = requiredSourceFields.find(([enabled, , value]) => enabled && !value.trim());
  if (missingSource) throw new TranslationBusinessError(`产品 ${product.sku} 的英文源字段“${missingSource[1]}”为空，已阻止翻译。`);

  const providerSource: TranslationQaDocument = {
    ...source,
    specifications: source.specifications.map((item) => ({
      ...item,
      displayValue: specificationPolicies.get(item.id)?.translateValue ? item.displayValue : "",
    })),
  };

  await onStep?.("BUILD_PROMPT");
  const sourceJson = JSON.stringify(providerSource);
  const inputHash = createHash("sha256")
    .update(`${state.provider}:${state.model}:${sourceLocale}:${targetLocale}:${sourceJson}`)
    .digest("hex");
  const systemPrompt = [
    `You are a senior localization editor for an international flooring manufacturer. Translate the supplied product content from ${localeNames[sourceLocale]} (${sourceLocale.toLowerCase()}) to ${localeNames[targetLocale]} (${targetLocale.toLowerCase()}).`,
    "Return professional native-language B2B copy suitable for architects, distributors, importers, and project buyers.",
    "Preserve the brand TOOYEI, SKU, model identifiers, technical meanings, all numbers, dimensions, standards, percentages, units, URLs, and item IDs exactly.",
    "Do not invent certifications, performance claims, warranties, applications, materials, or technical facts that are absent from the source.",
    "Translate every supplied visitor-facing field. Empty source fields must remain empty. Return every array item exactly once with the same id.",
    "Write a concise SEO title no longer than 70 characters and a complete, natural SEO description within the target language limit.",
    "For Arabic, use natural Modern Standard Arabic. For Chinese, use Simplified Chinese. For Japanese, use natural Japanese industry terminology.",
    "Return one valid JSON object only. Do not return Markdown, explanations, headings, comments, or ```json fences.",
    "Return the translated title, summary, seoTitle, and seoDescription inside the product object. Keep media, features, specifications, applications, and downloads as root arrays.",
    "Do not rename or omit fields. Every schema field must be present and every field value defined as a string must be a JSON string.",
    `Requested translation types: ${requestedContentTypes.join(", ")}.`,
    expected?.retryFeedback?.length
      ? `The previous output failed validation for these reasons: ${expected.retryFeedback.join("; ")}. Regenerate the translation and correct only these issues.`
      : "",
    buildBuildingMaterialsGlossaryPrompt(sourceJson, targetLocale),
  ].filter(Boolean).join(" ");
  await onStep?.("CALL_MODEL");
  const generated = await getTranslationProvider(state.provider, state.model).generateStructured({
    systemPrompt,
    sourceJson,
    schemaName: "tooyei_product_translation",
    schema: productTranslationJsonSchema,
    maxOutputTokens: 12000,
    sourceLanguage: sourceLocale.toLowerCase(),
    targetLanguage: targetLocale.toLowerCase(),
    glossaryTerms: getBuildingMaterialsGlossaryTerms(sourceJson, targetLocale),
    retryFeedback: expected?.retryFeedback,
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
  const ignoredQcWarnings = new Set([
    ...(!translatesProduct ? ["模型响应缺少 title", "模型响应缺少 summary"] : []),
    ...(!translatesSeo ? ["模型响应缺少 seoTitle", "模型响应缺少 seoDescription"] : []),
  ]);
  const warnings = [
    ...generated.warnings,
    ...getTranslationResultQcWarnings(normalizedResult).filter((warning) => !ignoredQcWarnings.has(warning)),
  ];
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
    }, "参数", warnings).map((item) => ({
      ...item,
      displayValue: specificationPolicies.get(item.id)?.translateValue
        ? item.displayValue
        : specificationPolicies.get(item.id)?.displayValue ?? item.displayValue,
    })),
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

  await onStep?.("QUALITY_CHECK");
  const baseQa = validateProductTranslation({ source, target: output, targetLocale, contentTypes: requestedContentTypes });
  const providerWarningIssues: TranslationQaIssue[] = warnings.map((warning) => ({
    code: "MODEL_WARNING",
    severity: "WARNING",
    field: "model",
    message: warning,
  }));
  const qaIssues = [...baseQa.issues, ...providerWarningIssues];
  const qaErrors = qaIssues.filter((entry) => entry.severity === "ERROR");
  const qaWarnings = qaIssues.filter((entry) => entry.severity === "WARNING");
  const qa: TranslationQaResult = {
    status: qaErrors.length ? "QA_FAILED" : qaWarnings.length ? "QA_WARNING" : "QA_PASSED",
    passed: qaErrors.length === 0,
    retryable: qaErrors.length > 0,
    issues: qaIssues,
    errors: qaErrors,
    warnings: qaWarnings,
    retryInstructions: qaErrors.map((entry) => `${entry.field}: ${entry.message}`),
  };
  if (!qa.passed) {
    throw new TranslationQualityError(
      `翻译质量校验失败：${qa.retryInstructions.join(" ")}`,
      qa,
      output,
      generated.outputText,
      generated.responseId,
      generated.promptTokens,
      generated.completionTokens,
      generated.totalTokens,
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
    promptVersion: productTranslationPromptVersion,
    warnings,
    qa,
    qaVersion: TRANSLATION_QA_VERSION,
  };
}

import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { Locale } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";

const localeNames: Record<Locale, string> = {
  ZH: "Simplified Chinese",
  EN: "English",
  DE: "German",
  FR: "French",
  ES: "Spanish",
  RU: "Russian",
  JA: "Japanese",
  IT: "Italian",
  AR: "Arabic",
  PT: "Portuguese",
  NL: "Dutch",
  PL: "Polish",
  TR: "Turkish",
  RO: "Romanian",
  CS: "Czech",
};

const textItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(180),
  description: z.string().max(1200),
});

export const productTranslationOutputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(800),
  seoTitle: z.string().trim().min(1).max(70),
  seoDescription: z.string().trim().min(1).max(180),
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
    title: stringProperty,
    summary: stringProperty,
    seoTitle: stringProperty,
    seoDescription: stringProperty,
    media: arrayOf(
      { id: stringProperty, alt: stringProperty, caption: stringProperty },
      ["id", "alt", "caption"],
    ),
    features: arrayOf(
      { id: stringProperty, title: stringProperty, description: stringProperty },
      ["id", "title", "description"],
    ),
    specifications: arrayOf(
      { id: stringProperty, group: stringProperty, label: stringProperty, displayValue: stringProperty },
      ["id", "group", "label", "displayValue"],
    ),
    applications: arrayOf(
      { id: stringProperty, title: stringProperty, description: stringProperty, imageAlt: stringProperty },
      ["id", "title", "description", "imageAlt"],
    ),
    downloads: arrayOf(
      { id: stringProperty, title: stringProperty, description: stringProperty },
      ["id", "title", "description"],
    ),
  },
  required: [
    "title",
    "summary",
    "seoTitle",
    "seoDescription",
    "media",
    "features",
    "specifications",
    "applications",
    "downloads",
  ],
  additionalProperties: false,
} as const;

type OpenAIResponse = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string } | null;
  incomplete_details?: { reason?: string } | null;
};

const getOutputText = (response: OpenAIResponse) => {
  if (response.output_text?.trim()) return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) {
        throw new Error(`模型拒绝了此翻译任务：${content.refusal}`);
      }
      if (content.type === "output_text" && content.text?.trim()) return content.text;
    }
  }
  throw new Error(response.incomplete_details?.reason
    ? `模型响应不完整：${response.incomplete_details.reason}`
    : "模型没有返回可用的结构化翻译内容。");
};

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

export type GeneratedProductTranslation = {
  output: ProductTranslationOutput;
  inputHash: string;
  responseId: string | null;
  inputTokens: number;
  outputTokens: number;
  warnings: string[];
};

export const isOpenAITranslationConfigured = () => Boolean(process.env.OPENAI_API_KEY?.trim());
export const getOpenAITranslationModel = () => process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-5.6-sol";

export async function generateProductTranslation(
  productId: string,
  sourceLocale: Locale,
  targetLocale: Locale,
): Promise<GeneratedProductTranslation> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("尚未配置 OPENAI_API_KEY，无法执行机器翻译。");
  if (sourceLocale === targetLocale) throw new Error("源语言和目标语言不能相同。");

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
  if (!product) throw new Error("产品不存在或已被删除。");

  const main = product.translations.find(({ locale }) => locale === sourceLocale);
  if (!main?.title.trim() || !main.summary.trim()) {
    throw new Error(`产品 ${product.sku} 缺少完整的 ${localeNames[sourceLocale]} 源语言标题或摘要。`);
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

  const serializedSource = JSON.stringify(source);
  const inputHash = createHash("sha256").update(`${sourceLocale}:${targetLocale}:${serializedSource}`).digest("hex");
  const model = getOpenAITranslationModel();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            `You are a senior localization editor for an international flooring manufacturer. Translate the supplied product content from ${localeNames[sourceLocale]} to ${localeNames[targetLocale]}.`,
            "Return professional native-language B2B copy suitable for architects, distributors, importers, and project buyers.",
            "Preserve the brand TOOYEI, SKU, model identifiers, technical meanings, all numbers, dimensions, standards, percentages, units, URLs, and item IDs exactly.",
            "Do not invent certifications, performance claims, warranties, applications, materials, or technical facts that are absent from the source.",
            "Translate every supplied visitor-facing field. Empty source fields must remain empty. Return every array item exactly once with the same id.",
            "Write a concise SEO title no longer than 70 characters and an accurate SEO description no longer than 180 characters in the target language.",
            "For Arabic, use natural Modern Standard Arabic. For Chinese, use Simplified Chinese. For Japanese, use natural Japanese industry terminology.",
          ].join(" "),
        },
        { role: "user", content: serializedSource },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tooyei_product_translation",
          schema: productTranslationJsonSchema,
          strict: true,
        },
      },
      max_output_tokens: 12000,
    }),
    signal: AbortSignal.timeout(110_000),
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponse | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error?.message || `OpenAI 请求失败（HTTP ${response.status}）。`);
  }
  if (payload.error?.message) throw new Error(payload.error.message);

  const parsedJson = JSON.parse(getOutputText(payload)) as unknown;
  const output = productTranslationOutputSchema.parse(parsedJson);
  const structuredPairs = [
    ["媒体", source.media, output.media],
    ["卖点", source.features, output.features],
    ["参数", source.specifications, output.specifications],
    ["应用场景", source.applications, output.applications],
    ["下载资料", source.downloads, output.downloads],
  ] as const;
  for (const [label, inputItems, outputItems] of structuredPairs) {
    if (!equalIds(inputItems, outputItems)) throw new Error(`${label}的项目 ID 与源内容不一致，已阻止写入。`);
  }

  const warnings: string[] = [];
  for (const sourceItem of source.specifications) {
    const translated = output.specifications.find(({ id }) => id === sourceItem.id);
    if (translated && numericTokens(sourceItem.displayValue).join("|") !== numericTokens(translated.displayValue).join("|")) {
      warnings.push(`参数“${sourceItem.label || sourceItem.id}”中的数字可能发生变化，请人工核对。`);
    }
  }

  return {
    output,
    inputHash,
    responseId: payload.id ?? null,
    inputTokens: payload.usage?.input_tokens ?? 0,
    outputTokens: payload.usage?.output_tokens ?? 0,
    warnings,
  };
}

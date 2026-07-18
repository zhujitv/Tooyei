import { Locale, TranslationStatus } from "@/generated/prisma/client";

export const englishSourceRequiredFields = [
  "title",
  "summary",
  "seoTitle",
  "seoDescription",
] as const;

export type EnglishSourceRequiredField = (typeof englishSourceRequiredFields)[number];

type TranslationLike = {
  locale?: Locale | string | null;
  status?: TranslationStatus | string | null;
  title?: unknown;
  summary?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  content?: unknown;
};

type ProductWithTranslations = {
  translations?: readonly TranslationLike[] | null;
};

export type NormalizedEnglishSourceContent = {
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  status: TranslationStatus;
  blocks: unknown[];
  specifications: Record<string, unknown>;
};

export type EnglishSourceContentResult =
  | {
      ok: true;
      code: "ENGLISH_SOURCE_READY";
      message: "英文内容完整";
      missingFields: [];
      content: NormalizedEnglishSourceContent;
    }
  | {
      ok: false;
      code: "ENGLISH_SOURCE_MISSING";
      message: "英文内容未创建";
      missingFields: [];
      content: null;
    }
  | {
      ok: false;
      code: "ENGLISH_SOURCE_INCOMPLETE";
      message: "英文内容不完整";
      missingFields: EnglishSourceRequiredField[];
      content: NormalizedEnglishSourceContent;
    };

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const objectValue = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const isEnglish = (locale: TranslationLike["locale"]) =>
  locale === Locale.EN || String(locale ?? "").toLowerCase() === "en";

export function getEnglishSourceContent(product: ProductWithTranslations): EnglishSourceContentResult {
  const translations = Array.isArray(product.translations) ? product.translations : [];
  const english = translations.find((translation) => isEnglish(translation?.locale));
  if (!english) {
    return {
      ok: false,
      code: "ENGLISH_SOURCE_MISSING",
      message: "英文内容未创建",
      missingFields: [],
      content: null,
    };
  }

  const rawContent = objectValue(english.content);
  const content: NormalizedEnglishSourceContent = {
    title: text(english.title),
    summary: text(english.summary),
    seoTitle: text(english.seoTitle),
    seoDescription: text(english.seoDescription),
    status: Object.values(TranslationStatus).includes(english.status as TranslationStatus)
      ? english.status as TranslationStatus
      : TranslationStatus.MISSING,
    blocks: Array.isArray(rawContent.blocks) ? rawContent.blocks : [],
    specifications: objectValue(rawContent.specifications),
  };
  const missingFields = englishSourceRequiredFields.filter((field) => !content[field]);

  if (missingFields.length) {
    return {
      ok: false,
      code: "ENGLISH_SOURCE_INCOMPLETE",
      message: "英文内容不完整",
      missingFields,
      content,
    };
  }

  return {
    ok: true,
    code: "ENGLISH_SOURCE_READY",
    message: "英文内容完整",
    missingFields: [],
    content,
  };
}

type CountLike = { media?: unknown; features?: unknown; specifications?: unknown };

export type ProductPublicationCandidate = ProductWithTranslations & {
  slug?: unknown;
  categoryId?: unknown;
  category?: object | null;
  categoryAssignments?: readonly unknown[] | null;
  primaryImage?: { url?: unknown; deletedAt?: unknown; blobDeletedAt?: unknown } | null;
  media?: readonly Array<{
    visible?: unknown;
    url?: unknown;
    asset?: { url?: unknown; deletedAt?: unknown; blobDeletedAt?: unknown } | null;
  }>[number][] | null;
  features?: readonly unknown[] | null;
  specifications?: readonly unknown[] | null;
  _count?: CountLike | null;
};

export type ProductPublicationValidation =
  | {
      ok: true;
      code: "PRODUCT_READY_TO_PUBLISH";
      message: "产品满足发布条件";
      missingFields: [];
      englishSource: EnglishSourceContentResult;
    }
  | {
      ok: false;
      code: "PRODUCT_PUBLICATION_BLOCKED";
      message: string;
      missingFields: string[];
      englishSource: EnglishSourceContentResult;
    };

const validAsset = (asset: ProductPublicationCandidate["primaryImage"]) =>
  Boolean(asset && text(asset.url) && !asset.deletedAt && !asset.blobDeletedAt);

const positiveCount = (value: unknown) => typeof value === "number" && value > 0;

export function validateProductForPublication(product: ProductPublicationCandidate): ProductPublicationValidation {
  const englishSource = getEnglishSourceContent(product);
  const missingFields: string[] = [];

  if (!text(product.slug)) missingFields.push("slug");
  if (!englishSource.content) {
    missingFields.push("englishSource");
  } else {
    missingFields.push(...englishSource.missingFields);
  }

  const hasCategory = Boolean(
    text(product.categoryId) ||
    product.category ||
    (Array.isArray(product.categoryAssignments) && product.categoryAssignments.length),
  );
  if (!hasCategory) missingFields.push("category");

  const media = Array.isArray(product.media) ? product.media : [];
  const hasMedia = validAsset(product.primaryImage) || media.some((item) => {
    if (item?.visible === false) return false;
    return validAsset(item?.asset ?? (item ? { url: item.url } : null));
  }) || positiveCount(product._count?.media);
  if (!hasMedia) missingFields.push("media");

  const hasFeatures = (Array.isArray(product.features) && product.features.length > 0) || positiveCount(product._count?.features);
  const hasSpecifications = (Array.isArray(product.specifications) && product.specifications.length > 0) || positiveCount(product._count?.specifications);
  if (!hasFeatures) missingFields.push("features");
  if (!hasSpecifications) missingFields.push("specifications");

  const uniqueMissingFields = Array.from(new Set(missingFields));
  if (uniqueMissingFields.length) {
    return {
      ok: false,
      code: "PRODUCT_PUBLICATION_BLOCKED",
      message: englishSource.code === "ENGLISH_SOURCE_MISSING"
        ? "英文内容未创建，不能发布产品"
        : englishSource.code === "ENGLISH_SOURCE_INCOMPLETE"
          ? "英文内容不完整，不能发布产品"
          : "产品发布资料不完整",
      missingFields: uniqueMissingFields,
      englishSource,
    };
  }

  return {
    ok: true,
    code: "PRODUCT_READY_TO_PUBLISH",
    message: "产品满足发布条件",
    missingFields: [],
    englishSource,
  };
}

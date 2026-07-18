"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentStatus, Locale, MediaKind, ProductDownloadKind, ProductMediaRole, TranslationStatus } from "@/generated/prisma/client";
import { requireProductManagerSession, requireTranslationManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  replaceProductStructuredContent,
  getAdminProduct,
  updateProductStructuredTranslations,
  updateProductCore,
  updateProductTranslation,
  ProductPublicationError,
  type AdminProductApplicationItem,
  type AdminProductDownloadItem,
  type AdminProductFeatureItem,
  type AdminProductMediaItem,
  type AdminProductSpecificationItem,
  type UpdateProductStructuredTranslationsInput,
} from "@/lib/repositories/admin-products";
import { logWarn } from "@/lib/observability";
import { createProductTranslationJob, type TranslationLocale } from "@/lib/repositories/product-translation-jobs";
import { contentLocales, localizedPath } from "@/lib/site";
import { productTranslationProviderId } from "@/lib/translation-providers/types";
import { isSpecificationValueTranslatable } from "@/lib/translation/quality";
import {
  structuredTranslationContentTypes,
  type TranslationContentType,
} from "@/lib/translation-worker-config";

const translationSchema = z.object({
  locale: z.enum(contentLocales),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(20).max(800),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
  status: z.enum(["MISSING", "MACHINE_DRAFT", "NEEDS_REVIEW", "PUBLISHED"]),
});

const coreSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
  categoryIds: z.array(z.string().min(1)).max(50),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.preprocess((value) => value === "on", z.boolean()),
  sortOrder: z.coerce.number().int().min(0).max(999999),
});

const structuredSchema = z.object({
  media: z.string().max(40000),
  features: z.string().max(40000),
  specifications: z.string().max(40000),
  applications: z.string().max(40000),
  downloads: z.string().max(40000),
});

const structuredTranslationPayloadSchema = z.object({
  media: z.array(z.object({ id: z.string().min(1), alt: z.string().trim().max(240), caption: z.string().trim().max(500) })).max(200),
  features: z.array(z.object({ id: z.string().min(1), title: z.string().trim().max(180), description: z.string().trim().max(1200) })).max(200),
  specifications: z.array(z.object({
    id: z.string().min(1),
    group: z.string().trim().max(120),
    label: z.string().trim().max(180),
    displayValue: z.string().trim().max(500),
  })).max(500),
  applications: z.array(z.object({
    id: z.string().min(1),
    title: z.string().trim().max(180),
    description: z.string().trim().max(1200),
    imageAlt: z.string().trim().max(240),
  })).max(200),
  downloads: z.array(z.object({ id: z.string().min(1), title: z.string().trim().max(180), description: z.string().trim().max(1200) })).max(200),
});

const revalidateProductPaths = (slug: string, locale?: string) => {
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  if (locale) {
    revalidatePath(localizedPath(locale as (typeof contentLocales)[number], `/products/${slug}`));
  } else {
    for (const item of contentLocales) revalidatePath(localizedPath(item, `/products/${slug}`));
  }
  revalidatePath("/admin/content");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
};

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("|").map((part) => part.trim()));

const parseSortOrder = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseVisible = (value: string | undefined) => {
  if (!value) return true;
  return !["0", "false", "no", "off", "隐藏", "否", "不显示"].includes(value.toLowerCase());
};

const parseEnum = <T extends Record<string, string>>(values: T, value: string | undefined, fallback: T[keyof T]) =>
  Object.values(values).includes(value as T[keyof T]) ? (value as T[keyof T]) : fallback;

const parseMediaRows = (value: string): AdminProductMediaItem[] =>
  splitLines(value)
    .map(([id, assetId, role, url, alt, caption, sortOrder, visible], index) => {
      const parsedRole = parseEnum(ProductMediaRole, role, index === 0 ? ProductMediaRole.PRIMARY : ProductMediaRole.GALLERY);
      return {
        id: id ?? "",
        assetId: assetId ?? "",
        role: parsedRole,
        kind: parsedRole === ProductMediaRole.VIDEO ? MediaKind.VIDEO : MediaKind.IMAGE,
        url: url ?? "",
        alt: alt ?? "",
        caption: caption ?? "",
        sortOrder: parseSortOrder(sortOrder, index),
        visible: parseVisible(visible),
      };
    })
    .filter((item) => item.assetId);

const parseFeatureRows = (value: string): AdminProductFeatureItem[] =>
  splitLines(value)
    .map(([id, title, description, icon, sortOrder, visible], index) => ({
      id: id ?? "",
      title: title ?? "",
      description: description ?? "",
      icon: icon ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title);

const parseSpecificationRows = (value: string): AdminProductSpecificationItem[] =>
  splitLines(value)
    .map(([id, group, label, rawValue, unit, sortOrder, visible], index) => ({
      id: id ?? "",
      group: group ?? "",
      label: label ?? "",
      value: rawValue ?? "",
      unit: unit ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.label && item.value);

const parseApplicationRows = (value: string): AdminProductApplicationItem[] =>
  splitLines(value)
    .map(([id, assetId, title, description, imageUrl, imageAlt, sortOrder, visible], index) => ({
      id: id ?? "",
      assetId: assetId ?? "",
      title: title ?? "",
      description: description ?? "",
      imageUrl: imageUrl ?? "",
      imageAlt: imageAlt ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title);

const parseDownloadRows = (value: string): AdminProductDownloadItem[] =>
  splitLines(value)
    .map(([id, assetId, kind, title, url, description, sortOrder, visible], index) => ({
      id: id ?? "",
      assetId: assetId ?? "",
      kind: parseEnum(ProductDownloadKind, kind, ProductDownloadKind.OTHER),
      title: title ?? "",
      url: url ?? "",
      description: description ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title && item.assetId);

export async function updateProductCoreAction(slug: string, formData: FormData) {
  const session = await requireProductManagerSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const parsed = coreSchema.safeParse({
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    categoryIds: formData.getAll("categoryIds"),
    status: formData.get("status"),
    featured: formData.get("featured"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) redirect(`/admin/products/${slug}?error=core`);

  let product;
  try {
    product = await updateProductCore({
      slug,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
      categoryIds: parsed.data.categoryIds,
      status: ContentStatus[parsed.data.status],
      featured: parsed.data.featured,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (error) {
    if (error instanceof ProductPublicationError) {
      logWarn("Product publication rejected", {
        operation: "admin-product.core.publication-validation",
        productSlug: error.productSlug,
        missingFields: error.missingFields,
      }, error);
      redirect(`/admin/products/${slug}?error=publish-blocked`);
    }
    throw error;
  }

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "product.core_updated",
    entityType: "Product",
    entityId: slug,
    metadata: product,
  });

  revalidateProductPaths(slug);
  redirect(`/admin/products/${slug}?saved=core`);
}

export async function updateProductTranslationAction(slug: string, formData: FormData) {
  const session = await requireTranslationManagerSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const parsed = translationSchema.safeParse({
    locale: formData.get("locale"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) redirect(`/admin/products/${slug}?error=validation`);

  const status = TranslationStatus[parsed.data.status];
  await updateProductTranslation({
    slug,
    locale: parsed.data.locale,
    title: parsed.data.title,
    summary: parsed.data.summary,
    seoTitle: parsed.data.seoTitle,
    seoDescription: parsed.data.seoDescription,
    status,
  });

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "product.translation_updated",
    entityType: "Product",
    entityId: slug,
    metadata: {
      locale: parsed.data.locale,
      status: parsed.data.status,
      hasSeoTitle: Boolean(parsed.data.seoTitle),
      hasSeoDescription: Boolean(parsed.data.seoDescription),
    },
  });

  revalidateProductPaths(slug, parsed.data.locale);
  const returnTab = formData.get("returnTab") === "seo" ? "seo" : "languages";
  redirect(`/admin/products/${slug}?saved=${parsed.data.locale}&tab=${returnTab}`);
}

export async function updateProductStructuredContentAction(slug: string, formData: FormData) {
  const session = await requireProductManagerSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const parsed = structuredSchema.safeParse({
    media: formData.get("media"),
    features: formData.get("features"),
    specifications: formData.get("specifications"),
    applications: formData.get("applications"),
    downloads: formData.get("downloads"),
  });
  if (!parsed.success) redirect(`/admin/products/${slug}?error=structured`);

  const result = await replaceProductStructuredContent({
    slug,
    media: parseMediaRows(parsed.data.media),
    features: parseFeatureRows(parsed.data.features),
    specifications: parseSpecificationRows(parsed.data.specifications),
    applications: parseApplicationRows(parsed.data.applications),
    downloads: parseDownloadRows(parsed.data.downloads),
  });

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "product.structured_content_updated",
    entityType: "Product",
    entityId: slug,
    metadata: result,
  });

  revalidateProductPaths(slug);
  redirect(`/admin/products/${slug}?saved=structured`);
}

export async function updateProductStructuredTranslationAction(slug: string, formData: FormData) {
  const session = await requireTranslationManagerSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const locale = z.enum(contentLocales).safeParse(formData.get("locale"));
  const rawPayload = formData.get("payload");
  if (!locale.success || typeof rawPayload !== "string" || rawPayload.length > 250_000) {
    redirect(`/admin/products/${slug}?error=structured-translation`);
  }

  let payload: z.infer<typeof structuredTranslationPayloadSchema>;
  try {
    payload = structuredTranslationPayloadSchema.parse(JSON.parse(rawPayload));
  } catch {
    redirect(`/admin/products/${slug}?error=structured-translation`);
  }

  const result = await updateProductStructuredTranslations({
    slug,
    locale: locale.data,
    ...payload,
  } satisfies UpdateProductStructuredTranslationsInput);

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "product.structured_translation_updated",
    entityType: "Product",
    entityId: slug,
    metadata: result,
  });

  revalidateProductPaths(slug, locale.data);
  redirect(`/admin/products/${slug}?saved=structured-${locale.data}`);
}

const contentLocaleToDatabaseLocale: Record<(typeof contentLocales)[number], TranslationLocale> = {
  en: Locale.EN,
  de: Locale.DE,
  fr: Locale.FR,
  es: Locale.ES,
  ru: Locale.RU,
  ja: Locale.JA,
  it: Locale.IT,
  ar: Locale.AR,
  zh: Locale.ZH,
};

const isStructuredTranslationType = (value: string): value is TranslationContentType =>
  structuredTranslationContentTypes.includes(value as (typeof structuredTranslationContentTypes)[number]);

export async function createProductStructuredTranslationJobAction(slug: string, formData: FormData) {
  const session = await requireTranslationManagerSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const request = String(formData.get("aiRequest") ?? "");
  const [mode, rawTypes = "all"] = request.split(":", 2);
  if (!["ALL_LANGUAGES", "MISSING_LANGUAGES", "CHANGED_FIELDS"].includes(mode)) {
    redirect(`/admin/products/${slug}?error=structured-translation-request`);
  }
  const requestedTypes = rawTypes === "all"
    ? [...structuredTranslationContentTypes]
    : rawTypes.split(",").filter(isStructuredTranslationType);
  if (!requestedTypes.length) redirect(`/admin/products/${slug}?error=structured-translation-request`);

  const product = await getAdminProduct(slug);
  if (!product) redirect(`/admin/products/${slug}?error=product-not-found`);

  const isMissingForLocale = (locale: (typeof contentLocales)[number]) => requestedTypes.some((type) => {
    if (type === "MEDIA_ALT") return product.media.some((item) => !item.translations?.[locale]?.alt.trim());
    if (type === "MEDIA_CAPTION") return product.media.some((item) => item.caption.trim() && !item.translations?.[locale]?.caption.trim());
    if (type === "FEATURE_TITLE") return product.features.some((item) => !item.translations?.[locale]?.title.trim());
    if (type === "FEATURE_DESCRIPTION") return product.features.some((item) => item.description.trim() && !item.translations?.[locale]?.description.trim());
    if (type === "SPEC_LABEL") return product.specifications.some((item) => !item.translations?.[locale]?.label.trim());
    if (type === "SPEC_VALUE") return product.specifications.some((item) => {
      const sourceValue = item.translations?.en?.displayValue.trim() || item.value;
      return isSpecificationValueTranslatable(sourceValue, item.unit) && !item.translations?.[locale]?.displayValue.trim();
    });
    if (type === "APPLICATION_TITLE") return product.applications.some((item) => !item.translations?.[locale]?.title.trim());
    if (type === "APPLICATION_DESCRIPTION") return product.applications.some((item) => item.description.trim() && !item.translations?.[locale]?.description.trim());
    if (type === "DOWNLOAD_TITLE") return product.downloads.some((item) => !item.translations?.[locale]?.title.trim());
    return false;
  });

  const targetContentLocales = contentLocales.filter((locale) => locale !== "en" && (
    mode !== "MISSING_LANGUAGES" || isMissingForLocale(locale)
  ));
  if (!targetContentLocales.length) redirect(`/admin/products/${slug}?error=structured-translations-complete`);

  let job: { id: string; totalItems: number };
  try {
    job = await createProductTranslationJob({
      actorEmail: session.email,
      provider: productTranslationProviderId,
      sourceLocale: Locale.EN,
      targetLocales: targetContentLocales.map((locale) => contentLocaleToDatabaseLocale[locale]),
      scope: "NON_PUBLISHED",
      productIds: [product.id],
      productLimit: 1,
      contentTypes: requestedTypes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建结构化翻译任务失败。";
    redirect(`/admin/products/${slug}?error=${encodeURIComponent(message.slice(0, 180))}`);
  }

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "product.structured_translation_job_created",
    entityType: "ProductTranslationJob",
    entityId: job.id,
    metadata: { productId: product.id, slug, mode, contentTypes: requestedTypes, totalItems: job.totalItems },
  });
  redirect(`/admin/translations/${job.id}?run=1`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentStatus, MediaKind, ProductDownloadKind, ProductMediaRole, TranslationStatus } from "@/generated/prisma/client";
import { getProductManagerSession, requireProductManagerSession, requireTranslationManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { productAssetFinalizeSchema, type ProductAssetFinalizeInput } from "@/lib/product-asset-policy";
import { persistProductAssetUpload } from "@/lib/product-asset-service";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  replaceProductStructuredContent,
  updateProductStructuredTranslations,
  updateProductCore,
  updateProductTranslation,
  type AdminProductApplicationItem,
  type AdminProductDownloadItem,
  type AdminProductFeatureItem,
  type AdminProductMediaItem,
  type AdminProductSpecificationItem,
  type UpdateProductStructuredTranslationsInput,
} from "@/lib/repositories/admin-products";
import { contentLocales, localizedPath } from "@/lib/site";

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
    .map(([id, role, url, alt, caption, sortOrder, visible], index) => {
      const parsedRole = parseEnum(ProductMediaRole, role, index === 0 ? ProductMediaRole.PRIMARY : ProductMediaRole.GALLERY);
      return {
        id: id ?? "",
        role: parsedRole,
        kind: parsedRole === ProductMediaRole.VIDEO ? MediaKind.VIDEO : MediaKind.IMAGE,
        url: url ?? "",
        alt: alt ?? "",
        caption: caption ?? "",
        sortOrder: parseSortOrder(sortOrder, index),
        visible: parseVisible(visible),
      };
    })
    .filter((item) => item.url);

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
    .map(([id, title, description, imageUrl, imageAlt, sortOrder, visible], index) => ({
      id: id ?? "",
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
    .map(([id, kind, title, url, description, sortOrder, visible], index) => ({
      id: id ?? "",
      kind: parseEnum(ProductDownloadKind, kind, ProductDownloadKind.OTHER),
      title: title ?? "",
      url: url ?? "",
      description: description ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title && item.url);

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

  const product = await updateProductCore({
    slug,
    sku: parsed.data.sku,
    categoryId: parsed.data.categoryId,
    categoryIds: parsed.data.categoryIds,
    status: ContentStatus[parsed.data.status],
    featured: parsed.data.featured,
    sortOrder: parsed.data.sortOrder,
  });

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
  redirect(`/admin/products/${slug}?saved=${parsed.data.locale}`);
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

export type ProductAssetFinalizeActionResult = {
  ok: boolean;
  message: string;
};

export async function finalizeProductAssetUploadAction(
  slug: string,
  input: ProductAssetFinalizeInput,
): Promise<ProductAssetFinalizeActionResult> {
  const session = await getProductManagerSession();
  if (!session) return { ok: false, message: "登录已过期或没有产品管理权限，请重新登录。" };
  if (!isDatabaseConfigured()) return { ok: false, message: "数据库尚未配置，无法关联产品。" };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, message: "Vercel Blob 尚未配置。" };

  const parsed = productAssetFinalizeSchema.safeParse(input);
  if (!parsed.success || parsed.data.metadata.slug !== slug) {
    return { ok: false, message: "上传文件信息校验失败。" };
  }

  try {
    await persistProductAssetUpload(parsed.data, session.email);
    return { ok: true, message: "文件已上传并关联到当前产品。" };
  } catch (error) {
    console.error("Product asset finalization failed", error instanceof Error ? error.message : error);
    return { ok: false, message: error instanceof Error ? error.message : "文件关联失败，请重试。" };
  }
}

"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentStatus, MediaKind, ProductDownloadKind, ProductMediaRole, TranslationStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  replaceProductStructuredContent,
  attachUploadedProductAsset,
  updateProductCore,
  updateProductTranslation,
  type AdminProductApplicationItem,
  type AdminProductDownloadItem,
  type AdminProductFeatureItem,
  type AdminProductMediaItem,
  type AdminProductSpecificationItem,
} from "@/lib/repositories/admin-products";

const uploadSchema = z.object({
  kind: z.enum(["media", "download"]),
  role: z.enum(ProductMediaRole),
  downloadKind: z.enum(ProductDownloadKind),
  title: z.string().trim().max(180),
  alt: z.string().trim().max(240),
  caption: z.string().trim().max(500),
});

const mediaUploadTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm",
]);

const documentUploadTypes = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const safeUploadName = (name: string) =>
  name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "asset";

const translationSchema = z.object({
  locale: z.enum(["zh", "en", "es", "de"]),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(20).max(800),
  seoTitle: z.string().trim().max(220).optional(),
  seoDescription: z.string().trim().max(360).optional(),
  status: z.enum(["MISSING", "MACHINE_DRAFT", "NEEDS_REVIEW", "PUBLISHED"]),
});

const coreSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
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

const revalidateProductPaths = (slug: string, locale?: string) => {
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  if (locale) {
    revalidatePath(locale === "zh" ? `/products/${slug}` : `/${locale}/products/${slug}`);
  } else {
    for (const item of ["en", "es", "de"]) revalidatePath(`/${item}/products/${slug}`);
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
    .map(([role, url, alt, caption, sortOrder, visible], index) => {
      const parsedRole = parseEnum(ProductMediaRole, role, index === 0 ? ProductMediaRole.PRIMARY : ProductMediaRole.GALLERY);
      return {
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
    .map(([title, description, icon, sortOrder, visible], index) => ({
      title: title ?? "",
      description: description ?? "",
      icon: icon ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title);

const parseSpecificationRows = (value: string): AdminProductSpecificationItem[] =>
  splitLines(value)
    .map(([group, label, rawValue, unit, sortOrder, visible], index) => ({
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
    .map(([title, description, imageUrl, imageAlt, sortOrder, visible], index) => ({
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
    .map(([kind, title, url, description, sortOrder, visible], index) => ({
      kind: parseEnum(ProductDownloadKind, kind, ProductDownloadKind.OTHER),
      title: title ?? "",
      url: url ?? "",
      description: description ?? "",
      sortOrder: parseSortOrder(sortOrder, index),
      visible: parseVisible(visible),
    }))
    .filter((item) => item.title && item.url);

export async function updateProductCoreAction(slug: string, formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const parsed = coreSchema.safeParse({
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    featured: formData.get("featured"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) redirect(`/admin/products/${slug}?error=core`);

  const product = await updateProductCore({
    slug,
    sku: parsed.data.sku,
    categoryId: parsed.data.categoryId,
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
  const session = await requireAdminSession();
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
  const session = await requireAdminSession();
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

export async function uploadProductAssetAction(slug: string, formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect(`/admin/products/${slug}?error=upload`);

  const file = formData.get("file");
  const parsed = uploadSchema.safeParse({
    kind: formData.get("kind"),
    role: formData.get("role"),
    downloadKind: formData.get("downloadKind"),
    title: formData.get("title") || "",
    alt: formData.get("alt") || "",
    caption: formData.get("caption") || "",
  });
  if (!(file instanceof File) || !file.size || file.size > 3_800_000 || !parsed.success) {
    redirect(`/admin/products/${slug}?error=upload`);
  }

  const isMediaUpload = parsed.data.kind === "media";
  const isVideo = file.type.startsWith("video/");
  const typeMatchesPurpose = isMediaUpload ? mediaUploadTypes.has(file.type) : documentUploadTypes.has(file.type);
  const roleMatchesMedia = !isMediaUpload || isVideo || parsed.data.role !== ProductMediaRole.VIDEO;
  if (!typeMatchesPurpose || !roleMatchesMedia) {
    redirect(`/admin/products/${slug}?error=upload`);
  }

  let blob: Awaited<ReturnType<typeof put>> | undefined;
  try {
    blob = await put(`products/${slug}/${safeUploadName(file.name)}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    const result = await attachUploadedProductAsset({
      slug,
      pathname: blob.pathname,
      url: blob.url,
      contentType: file.type,
      sizeBytes: file.size,
      kind: parsed.data.kind,
      role: parsed.data.role,
      downloadKind: parsed.data.downloadKind,
      title: parsed.data.title,
      alt: parsed.data.alt,
      caption: parsed.data.caption,
    });
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product.asset_uploaded",
      entityType: "Product",
      entityId: slug,
      metadata: result,
    });
  } catch (error) {
    if (blob) await del(blob.url).catch(() => undefined);
    console.error("Product asset upload failed", error instanceof Error ? error.message : error);
    redirect(`/admin/products/${slug}?error=upload`);
  }

  revalidateProductPaths(slug);
  redirect(`/admin/products/${slug}?saved=upload`);
}

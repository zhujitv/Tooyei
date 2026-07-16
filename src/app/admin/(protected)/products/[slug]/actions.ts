"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentStatus, TranslationStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { updateProductCore, updateProductTranslation } from "@/lib/repositories/admin-products";

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

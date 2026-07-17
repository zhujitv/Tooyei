"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { createProduct, updateProductListSettings } from "@/lib/repositories/admin-products";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const createProductSchema = z.object({
  slug: slugSchema,
  sku: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.preprocess((value) => value === "on", z.boolean()),
  sortOrder: z.coerce.number().int().min(0).max(999999),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(20).max(800),
  seoTitle: z.string().trim().max(220).optional(),
  seoDescription: z.string().trim().max(360).optional(),
});

const quickSettingsSchema = z.object({
  slug: slugSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.preprocess((value) => value === "on", z.boolean()),
  sortOrder: z.coerce.number().int().min(0).max(999999),
});

const revalidateProductAdminPaths = (slug?: string) => {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/content");
  revalidatePath("/admin/products");
  if (slug) {
    revalidatePath(`/products/${slug}`);
    revalidatePath(`/admin/products/${slug}`);
    for (const locale of ["en", "es", "de"]) {
      revalidatePath(`/${locale}/products`);
      revalidatePath(`/${locale}/products/${slug}`);
    }
  }
};

export async function createProductAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirect("/admin/products?error=database");

  const parsed = createProductSchema.safeParse({
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    featured: formData.get("featured"),
    sortOrder: formData.get("sortOrder") || 0,
    title: formData.get("title"),
    summary: formData.get("summary"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
  if (!parsed.success) redirect("/admin/products?error=create");

  let createdSlug: string;
  try {
    const product = await createProduct({
      slug: parsed.data.slug,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
      status: ContentStatus[parsed.data.status],
      featured: parsed.data.featured,
      sortOrder: parsed.data.sortOrder,
      title: parsed.data.title,
      summary: parsed.data.summary,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    });
    createdSlug = product.slug;

    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product.created",
      entityType: "Product",
      entityId: product.slug,
      metadata: product,
    });

    revalidateProductAdminPaths(product.slug);
  } catch (error) {
    console.error("Create product failed", error instanceof Error ? error.message : error);
    redirect("/admin/products?error=create");
  }

  redirect(`/admin/products/${createdSlug}?saved=created`);
}

export async function updateProductListSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirect("/admin/products?error=database");

  const parsed = quickSettingsSchema.safeParse({
    slug: formData.get("slug"),
    status: formData.get("status"),
    featured: formData.get("featured"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect("/admin/products?error=quick");

  try {
    const product = await updateProductListSettings({
      slug: parsed.data.slug,
      status: ContentStatus[parsed.data.status],
      featured: parsed.data.featured,
      sortOrder: parsed.data.sortOrder,
    });

    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product.quick_settings_updated",
      entityType: "Product",
      entityId: product.slug,
      metadata: product,
    });

    revalidateProductAdminPaths(product.slug);
  } catch (error) {
    console.error("Update product quick settings failed", error instanceof Error ? error.message : error);
    redirect("/admin/products?error=quick");
  }

  redirect("/admin/products?saved=quick");
}

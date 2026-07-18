"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AdminRole, ContentStatus } from "@/generated/prisma/client";
import { requireProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  assignProductsToCategory,
  batchDeleteProducts,
  batchReviewProducts,
  batchUpdateProducts,
  createProduct,
  fillMissingProductSeo,
  ProductBatchOperationError,
  ProductPublicationError,
  updateProductListSettings,
} from "@/lib/repositories/admin-products";
import { contentLocales, localizedPath } from "@/lib/site";
import { logError, logWarn } from "@/lib/observability";

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

const quickCategorySchema = z.object({
  slug: slugSchema,
  categoryId: z.string().min(1),
});

const batchSchema = z.object({
  slugs: z.array(slugSchema).min(1).max(200),
  operation: z.enum(["REVIEW", "PUBLISH", "DRAFT", "ARCHIVE", "FEATURE", "UNFEATURE", "ASSIGN_CATEGORY", "FILL_SEO", "DELETE"]),
  categoryId: z.string().optional(),
});

const revalidateProductAdminPaths = (slugs?: string | string[]) => {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/content");
  revalidatePath("/admin/products");
  for (const slug of typeof slugs === "string" ? [slugs] : slugs ?? []) {
    revalidatePath(`/products/${slug}`);
    revalidatePath(`/admin/products/${slug}`);
    for (const locale of contentLocales) {
      revalidatePath(localizedPath(locale, "/products"));
      revalidatePath(localizedPath(locale, `/products/${slug}`));
    }
  }
};

const feedbackPath = (formData: FormData, kind: "saved" | "error", value: string) => {
  const raw = formData.get("returnTo");
  const target = typeof raw === "string" ? raw : "/admin/products";
  const url = new URL(target, "https://admin.tooyei.local");
  if (url.pathname !== "/admin/products") url.pathname = "/admin/products";
  url.searchParams.delete("saved");
  url.searchParams.delete("error");
  url.searchParams.set(kind, value);
  return `${url.pathname}${url.search}`;
};

export async function createProductAction(formData: FormData) {
  const session = await requireProductManagerSession();
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
      categoryIds: [parsed.data.categoryId],
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
    if (error instanceof ProductPublicationError) {
      logWarn("Product publication rejected", {
        operation: "admin-product.create.publication-validation",
        productSlug: error.productSlug,
        missingFields: error.missingFields,
      }, error);
      redirect("/admin/products?error=publish-blocked");
    }
    logError("Create product failed", { operation: "admin-product.create" }, error);
    redirect("/admin/products?error=create");
  }

  redirect(`/admin/products/${createdSlug}?saved=created`);
}

export async function updateProductListSettingsAction(formData: FormData) {
  const session = await requireProductManagerSession();
  if (!isDatabaseConfigured()) redirect(feedbackPath(formData, "error", "database"));

  const parsed = quickSettingsSchema.safeParse({
    slug: formData.get("slug"),
    status: formData.get("status"),
    featured: formData.get("featured"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect(feedbackPath(formData, "error", "quick"));

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
    if (error instanceof ProductPublicationError) {
      logWarn("Product publication rejected", {
        operation: "admin-product.quick-update.publication-validation",
        productSlug: error.productSlug,
        missingFields: error.missingFields,
      }, error);
      redirect(feedbackPath(formData, "error", "publish-blocked"));
    }
    logError("Update product quick settings failed", { operation: "admin-product.quick-update" }, error);
    redirect(feedbackPath(formData, "error", "quick"));
  }

  redirect(feedbackPath(formData, "saved", "quick"));
}

export async function assignProductCategoryAction(formData: FormData) {
  const session = await requireProductManagerSession();
  if (!isDatabaseConfigured()) redirect(feedbackPath(formData, "error", "database"));

  const parsed = quickCategorySchema.safeParse({
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) redirect(feedbackPath(formData, "error", "category"));

  try {
    const result = await assignProductsToCategory([parsed.data.slug], parsed.data.categoryId);
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product.category_assigned",
      entityType: "Product",
      entityId: parsed.data.slug,
      metadata: result,
    });
    revalidateProductAdminPaths(parsed.data.slug);
  } catch (error) {
    logError("Assign product category failed", { operation: "admin-product.assign-category" }, error);
    redirect(feedbackPath(formData, "error", "category"));
  }

  redirect(feedbackPath(formData, "saved", "category"));
}

export async function batchUpdateProductsAction(formData: FormData) {
  const session = await requireProductManagerSession();
  if (!isDatabaseConfigured()) redirect(feedbackPath(formData, "error", "database"));

  const parsed = batchSchema.safeParse({
    slugs: formData.getAll("slugs"),
    operation: formData.get("operation"),
    categoryId: formData.get("categoryId") || undefined,
  });
  if (!parsed.success) redirect(feedbackPath(formData, "error", "batch"));
  if (parsed.data.operation === "DELETE" && session.role !== AdminRole.OWNER) {
    logWarn("Batch product deletion denied", {
      operation: "admin-product.batch-delete.permission",
      actorEmail: session.email,
      actorRole: session.role,
    });
    redirect(feedbackPath(formData, "error", "batch-delete-permission"));
  }

  try {
    let result: { count: number; translationCount?: number; orphanedAssetCount?: number };
    if (parsed.data.operation === "ASSIGN_CATEGORY") {
      if (!parsed.data.categoryId) throw new Error("Category is required for batch assignment.");
      result = await assignProductsToCategory(parsed.data.slugs, parsed.data.categoryId);
    } else if (parsed.data.operation === "FILL_SEO") {
      result = await fillMissingProductSeo(parsed.data.slugs);
    } else if (parsed.data.operation === "REVIEW") {
      result = await batchReviewProducts(parsed.data.slugs);
    } else if (parsed.data.operation === "DELETE") {
      result = await batchDeleteProducts(parsed.data.slugs);
    } else {
      result = await batchUpdateProducts(parsed.data.slugs, parsed.data.operation);
    }
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: parsed.data.operation === "DELETE"
        ? "product.batch_deleted"
        : parsed.data.operation === "REVIEW"
          ? "product.batch_reviewed"
          : "product.batch_updated",
      entityType: "Product",
      entityId: parsed.data.slugs.join(","),
      metadata: {
        operation: parsed.data.operation,
        categoryId: parsed.data.categoryId,
        requested: parsed.data.slugs.length,
        updated: result.count,
        ...(result.translationCount === undefined ? {} : { reviewedTranslations: result.translationCount }),
        ...(result.orphanedAssetCount === undefined ? {} : { orphanedAssets: result.orphanedAssetCount }),
      },
    });

    revalidateProductAdminPaths(parsed.data.slugs);
  } catch (error) {
    if (error instanceof ProductBatchOperationError) {
      logWarn("Batch product operation rejected", {
        operation: "admin-product.batch-update.validation",
        batchOperation: parsed.data.operation,
        reason: error.code,
      }, error);
      const feedback = error.code === "DELETE_BLOCKED"
        ? "batch-delete-blocked"
        : error.code === "NOTHING_TO_REVIEW"
          ? "batch-review-empty"
          : error.code === "PUBLICATION_BLOCKED"
            ? "publish-blocked"
            : "batch-stale";
      redirect(feedbackPath(formData, "error", feedback));
    }
    logError("Batch update products failed", { operation: "admin-product.batch-update" }, error);
    redirect(feedbackPath(formData, "error", "batch"));
  }

  redirect(feedbackPath(formData, "saved", "batch"));
}

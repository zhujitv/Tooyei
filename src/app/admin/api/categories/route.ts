import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { categoryErrorMessage, categoryMutationSchema } from "@/lib/category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { createCategory, getAdminCategoryTree } from "@/lib/repositories/categories";
import { contentLocales, localizedPath } from "@/lib/site";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const refreshCategoryPages = () => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  for (const locale of contentLocales) revalidatePath(localizedPath(locale, "/products"));
  revalidatePath("/sitemap.xml");
};

const errorResponse = (request: Request | undefined, error: unknown, status = 400) =>
  apiError(request, { code: "CATEGORY_REQUEST_FAILED", message: categoryErrorMessage(error), status, operation: "category.collection", error });

export async function GET(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有产品栏目管理权限。"), 403);
  try {
    return NextResponse.json({ ok: true, categories: await getAdminCategoryTree() });
  } catch (error) {
    return errorResponse(request, error, 500);
  }
}

export async function POST(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有产品栏目管理权限。"), 403);

  try {
    const parsed = categoryMutationSchema.parse(await request.json());
    const category = await createCategory(parsed);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: "category.created",
      entityType: "Category",
      entityId: category.id,
      metadata: { slug: category.slug, parentId: parsed.parentId },
    });
    refreshCategoryPages();
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    return errorResponse(request, error);
  }
}

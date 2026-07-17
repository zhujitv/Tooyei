import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { categoryErrorMessage, categoryPatchSchema } from "@/lib/category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { deleteCategory, setCategoryActive, updateCategory } from "@/lib/repositories/categories";
import { contentLocales, localizedPath } from "@/lib/site";

export const dynamic = "force-dynamic";

const refreshCategoryPages = (slug?: string) => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
  for (const locale of contentLocales) {
    revalidatePath(localizedPath(locale, "/products"));
    if (slug) revalidatePath(localizedPath(locale, `/products/${slug}`));
  }
  revalidatePath("/sitemap.xml");
};

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json(
    { ok: false, error: categoryErrorMessage(error) },
    { status },
  );

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(new Error("没有产品栏目管理权限。"), 403);

  try {
    const { id } = await context.params;
    const parsed = categoryPatchSchema.parse(await request.json());
    const result =
      parsed.action === "toggle"
        ? await setCategoryActive(id, parsed.isActive)
        : await updateCategory(id, parsed.data);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: parsed.action === "toggle" ? "category.status_updated" : "category.updated",
      entityType: "Category",
      entityId: id,
      metadata: parsed.action === "toggle" ? { isActive: parsed.isActive } : { slug: parsed.data.slug, parentId: parsed.data.parentId },
    });
    refreshCategoryPages(parsed.action === "update" ? parsed.data.slug : undefined);
    return NextResponse.json({ ok: true, category: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(new Error("没有产品栏目管理权限。"), 403);

  try {
    const { id } = await context.params;
    const result = await deleteCategory(id);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: "category.deleted",
      entityType: "Category",
      entityId: id,
    });
    refreshCategoryPages();
    return NextResponse.json({ ok: true, category: result });
  } catch (error) {
    return errorResponse(error);
  }
}

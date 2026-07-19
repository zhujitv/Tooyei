import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { articleCategoryErrorMessage, articleCategoryPatchSchema } from "@/lib/article-category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  deleteArticleCategory,
  setArticleCategoryActive,
  updateArticleCategory,
} from "@/lib/repositories/article-categories";
import { contentLocales, localizedPath } from "@/lib/site";

export const dynamic = "force-dynamic";

const refreshArticleCategoryPages = (slug?: string) => {
  revalidatePath("/admin/article-categories");
  revalidatePath("/admin/articles");
  revalidatePath("/insights");
  if (slug) revalidatePath(`/insights/category/${slug}`);
  for (const locale of contentLocales) {
    revalidatePath(localizedPath(locale, "/insights"));
    if (slug) revalidatePath(localizedPath(locale, `/insights/category/${slug}`));
  }
  revalidatePath("/sitemap.xml");
};

const errorResponse = (request: Request, error: unknown, status = 400) =>
  apiError(request, {
    code: "ARTICLE_CATEGORY_REQUEST_FAILED",
    message: articleCategoryErrorMessage(error),
    status,
    operation: "article-category.item",
    error,
  });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有文章栏目管理权限。"), 403);
  try {
    const { id } = await context.params;
    const parsed = articleCategoryPatchSchema.parse(await request.json());
    const result = parsed.action === "toggle"
      ? await setArticleCategoryActive(id, parsed.isActive)
      : await updateArticleCategory(id, parsed.data);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: parsed.action === "toggle" ? "article-category.status_updated" : "article-category.updated",
      entityType: "ArticleCategory",
      entityId: id,
      metadata: parsed.action === "toggle" ? { isActive: parsed.isActive } : { slug: parsed.data.slug },
    });
    refreshArticleCategoryPages(parsed.action === "update" ? parsed.data.slug : undefined);
    return NextResponse.json({ ok: true, category: result });
  } catch (error) {
    return errorResponse(request, error);
  }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有文章栏目管理权限。"), 403);
  try {
    const { id } = await context.params;
    const result = await deleteArticleCategory(id);
    await safeWriteAuditLog({ actorEmail: actor.email, action: "article-category.deleted", entityType: "ArticleCategory", entityId: id });
    refreshArticleCategoryPages();
    return NextResponse.json({ ok: true, category: result });
  } catch (error) {
    return errorResponse(request, error);
  }
}

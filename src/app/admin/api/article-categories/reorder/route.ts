import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { articleCategoryErrorMessage, articleCategoryReorderSchema } from "@/lib/article-category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { reorderArticleCategories } from "@/lib/repositories/article-categories";
import { contentLocales, localizedPath } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return apiError(request, { code: "FORBIDDEN", message: "没有文章栏目管理权限。", status: 403, operation: "article-category.reorder" });
  try {
    const parsed = articleCategoryReorderSchema.parse(await request.json());
    const result = await reorderArticleCategories(parsed.orderedIds);
    await safeWriteAuditLog({ actorEmail: actor.email, action: "article-category.reordered", entityType: "ArticleCategory", metadata: result });
    revalidatePath("/admin/article-categories");
    revalidatePath("/admin/articles");
    revalidatePath("/insights");
    for (const locale of contentLocales) revalidatePath(localizedPath(locale, "/insights"));
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiError(request, {
      code: "ARTICLE_CATEGORY_REORDER_FAILED",
      message: articleCategoryErrorMessage(error, "文章栏目排序失败。"),
      status: 400,
      operation: "article-category.reorder",
      error,
    });
  }
}

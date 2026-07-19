import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { articleCategoryErrorMessage, articleCategoryMutationSchema } from "@/lib/article-category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { createArticleCategory, getAdminArticleCategories } from "@/lib/repositories/article-categories";
import { contentLocales, localizedPath } from "@/lib/site";

export const dynamic = "force-dynamic";

const refreshArticleCategoryPages = () => {
  revalidatePath("/admin/article-categories");
  revalidatePath("/admin/articles");
  revalidatePath("/insights");
  for (const locale of contentLocales) revalidatePath(localizedPath(locale, "/insights"));
  revalidatePath("/sitemap.xml");
};

const errorResponse = (request: Request, error: unknown, status = 400) =>
  apiError(request, {
    code: "ARTICLE_CATEGORY_REQUEST_FAILED",
    message: articleCategoryErrorMessage(error),
    status,
    operation: "article-category.collection",
    error,
  });

export async function GET(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有文章栏目管理权限。"), 403);
  try {
    return NextResponse.json({ ok: true, categories: await getAdminArticleCategories() });
  } catch (error) {
    return errorResponse(request, error, 500);
  }
}
export async function POST(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return errorResponse(request, new Error("没有文章栏目管理权限。"), 403);
  try {
    const parsed = articleCategoryMutationSchema.parse(await request.json());
    const category = await createArticleCategory(parsed);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: "article-category.created",
      entityType: "ArticleCategory",
      entityId: category.id,
      metadata: { slug: category.slug },
    });
    refreshArticleCategoryPages();
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    return errorResponse(request, error);
  }
}

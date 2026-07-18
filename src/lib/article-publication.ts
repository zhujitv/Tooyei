import { normalizeArticleContent } from "@/lib/article-content";

export type ArticleSourceFields = {
  title?: string | null;
  excerpt?: string | null;
  content?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export const articleRequiredFields = ["title", "excerpt", "content", "seoTitle", "seoDescription"] as const;
export type ArticleRequiredField = (typeof articleRequiredFields)[number];

export function validateArticleSource(source: ArticleSourceFields | null | undefined) {
  const missingFields: ArticleRequiredField[] = [];
  if (!source?.title?.trim()) missingFields.push("title");
  if (!source?.excerpt?.trim()) missingFields.push("excerpt");
  if (!normalizeArticleContent(source?.content).blocks.length) missingFields.push("content");
  if (!source?.seoTitle?.trim()) missingFields.push("seoTitle");
  if (!source?.seoDescription?.trim()) missingFields.push("seoDescription");
  return {
    ok: missingFields.length === 0,
    code: missingFields.length ? "ARTICLE_SOURCE_INCOMPLETE" as const : "ARTICLE_SOURCE_READY" as const,
    message: missingFields.length ? "文章内容不完整" : "文章内容可发布",
    missingFields,
  };
}

export const articleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

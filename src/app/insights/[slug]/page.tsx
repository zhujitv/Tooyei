import type { Metadata } from "next";
import { InsightArticlePage } from "@/components/insight-article-page";
import { getPublishedArticleBySlug } from "@/lib/repositories/articles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug, "zh");
  if (!article) return {};
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: article.hasExactTranslation ? `/zh/insights/${slug}` : `/${article.resolvedLocale}/insights/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <InsightArticlePage locale="zh" slug={slug} />;
}

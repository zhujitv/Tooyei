import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightsPage } from "@/components/insights-page";
import { getPublicArticleCategoryBySlug } from "@/lib/repositories/article-categories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicArticleCategoryBySlug(slug, "zh");
  if (!category) return {};
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: `/zh/insights/category/${category.slug}` },
  };
}

export default async function ArticleCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getPublicArticleCategoryBySlug(slug, "zh");
  if (!category) notFound();
  return <InsightsPage locale="zh" selectedCategory={category} />;
}

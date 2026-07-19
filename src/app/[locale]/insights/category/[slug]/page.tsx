import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightsPage } from "@/components/insights-page";
import { getPublicArticleCategoryBySlug } from "@/lib/repositories/article-categories";
import { isLocale, localizedAlternates, localizedPath, openGraphLocales } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const category = await getPublicArticleCategoryBySlug(slug, locale);
  if (!category) return {};
  const path = `/insights/category/${category.slug}`;
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: localizedPath(locale, path), languages: localizedAlternates(path) },
    openGraph: {
      type: "website",
      title: category.seoTitle,
      description: category.seoDescription,
      url: localizedPath(locale, path),
      locale: openGraphLocales[locale],
    },
  };
}

export default async function ArticleCategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const category = await getPublicArticleCategoryBySlug(slug, locale);
  if (!category) notFound();
  return <InsightsPage locale={locale} selectedCategory={category} />;
}

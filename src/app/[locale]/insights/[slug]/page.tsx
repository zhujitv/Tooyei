import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightArticlePage } from "@/components/insight-article-page";
import { getPublishedArticleBySlug } from "@/lib/repositories/articles";
import { isLocale, localizedPath, openGraphLocales } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) return {};
  const canonicalLocale = article.hasExactTranslation ? locale : article.resolvedLocale;
  const canonical = localizedPath(canonicalLocale, `/insights/${slug}`);
  const languages = Object.fromEntries(article.availableLocales.map((availableLocale) => [availableLocale, localizedPath(availableLocale, `/insights/${slug}`)]));
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical, languages: { ...languages, "x-default": languages.en ?? languages.zh ?? canonical } },
    robots: article.hasExactTranslation ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article", title: article.seoTitle, description: article.seoDescription,
      url: canonical, locale: openGraphLocales[canonicalLocale],
      publishedTime: article.publishedAt.toISOString(), modifiedTime: article.updatedAt.toISOString(),
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <InsightArticlePage locale={locale} slug={slug} />;
}

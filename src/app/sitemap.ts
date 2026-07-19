import type { MetadataRoute } from "next";
import { resolveSeoUrl } from "@/lib/article-seo";
import { capabilitySlugs } from "@/lib/capabilities";
import { getPublicCategorySlugs } from "@/lib/repositories/categories";
import { getPublicArticleCategorySlugs } from "@/lib/repositories/article-categories";
import { getArticleSitemapRecords } from "@/lib/repositories/articles";
import { getPublishedProductSlugs } from "@/lib/repositories/products";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import { locales, localizedPath } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs, articleCategorySlugs, articleRecords, settings] = await Promise.all([getPublishedProductSlugs(), getPublicCategorySlugs(), getPublicArticleCategorySlugs(), getArticleSitemapRecords(), getPublicSiteSettings()]);
  const paths = [
    "/",
    "/products",
    "/capabilities",
    "/insights",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    ...capabilitySlugs.map((slug) => `/capabilities/${slug}`),
    ...categorySlugs.map((slug) => `/products/${slug}`),
    ...articleCategorySlugs.map((slug) => `/insights/category/${slug}`),
    ...productSlugs.map((slug) => `/products/${slug}`),
  ];
  const localizedEntries = locales.flatMap((locale) =>
    paths.map((path) => ({
      url: new URL(localizedPath(locale, path), settings.siteUrl).toString(),
      lastModified: new Date(),
      changeFrequency: path.includes("/products/") || path === "/insights" ? "weekly" as const : "monthly" as const,
      priority: path === "/" ? 1 : path === "/products" ? 0.9 : path === "/capabilities" || path === "/insights" ? 0.8 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((language) => [language, new URL(localizedPath(language, path), settings.siteUrl).toString()])),
      },
    })),
  );
  const articleEntries = articleRecords.flatMap((article) => {
    const languages = Object.fromEntries(article.locales.map((language) => [
      language,
      new URL(localizedPath(language, `/insights/${article.slug}`), settings.siteUrl).toString(),
    ]));
    const image = resolveSeoUrl(article.coverImage, settings.siteUrl);
    const alternateLanguages = { ...languages, "x-default": languages.en ?? languages.zh ?? Object.values(languages)[0] };
    return article.locales.map((locale) => ({
      url: new URL(localizedPath(locale, `/insights/${article.slug}`), settings.siteUrl).toString(),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
      alternates: { languages: alternateLanguages },
      ...(image ? { images: [image] } : {}),
    }));
  });
  const policyEntries = ["/privacy", "/terms", "/cookies"].map((path) => ({
    url: new URL(path, settings.siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));
  return [
    { url: new URL("/", settings.siteUrl).toString(), lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    ...localizedEntries,
    ...articleEntries,
    ...policyEntries,
  ];
}

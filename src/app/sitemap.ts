import type { MetadataRoute } from "next";
import { capabilitySlugs } from "@/lib/capabilities";
import { getPublicCategorySlugs } from "@/lib/repositories/categories";
import { getPublishedProductSlugs } from "@/lib/repositories/products";
import { locales, localizedPath, siteConfig } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs] = await Promise.all([getPublishedProductSlugs(), getPublicCategorySlugs()]);
  const paths = [
    "/",
    "/products",
    "/capabilities",
    "/contact",
    ...capabilitySlugs.map((slug) => `/capabilities/${slug}`),
    ...categorySlugs.map((slug) => `/products/${slug}`),
    ...productSlugs.map((slug) => `/products/${slug}`),
  ];
  const localizedEntries = locales.flatMap((locale) =>
    paths.map((path) => ({
      url: new URL(localizedPath(locale, path), siteConfig.url).toString(),
      lastModified: new Date(),
      changeFrequency: path.includes("/products/") ? "weekly" as const : "monthly" as const,
      priority: path === "/" ? 1 : path === "/products" ? 0.9 : path === "/capabilities" ? 0.8 : 0.7,
    })),
  );
  const policyEntries = ["/privacy", "/terms", "/cookies"].map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));
  return [
    { url: new URL("/", siteConfig.url).toString(), lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    ...localizedEntries,
    ...policyEntries,
  ];
}

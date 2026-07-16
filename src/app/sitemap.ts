import type { MetadataRoute } from "next";
import { getPublishedProductSlugs } from "@/lib/repositories/products";
import { locales, localizedPath, siteConfig } from "@/lib/site";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productSlugs = await getPublishedProductSlugs();
  const paths=["/","/products","/contact",...productSlugs.map((slug)=>`/products/${slug}`)];
  return locales.flatMap((locale)=>paths.map((path)=>({url:new URL(localizedPath(locale,path),siteConfig.url).toString(),lastModified:new Date(),changeFrequency:path.includes("/products/")?"weekly":"monthly",priority:path==="/"?1:path==="/products"?0.9:0.7})));
}

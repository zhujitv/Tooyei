import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSiteSettings();
  return {
    rules: settings.allowIndexing
      ? { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${settings.siteUrl}/sitemap.xml`,
    host: settings.siteUrl,
  };
}

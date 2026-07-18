import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { HomePage } from "@/components/home-page";
import { LanguageRecommendationBanner } from "@/components/language-recommendation-banner";
import {
  detectPreferredLocale,
  isSearchCrawler,
  LANGUAGE_COOKIE,
  LANGUAGE_PROMPT_COOKIE,
} from "@/lib/language-preference";
import { localizedAlternates, type Locale } from "@/lib/site";
import { logError } from "@/lib/observability";

export const metadata: Metadata = {
  title: "TOOYEI 专业地板系统与 OEM / ODM 解决方案",
  description: "面向进口商、经销商、工程项目与自有品牌客户，提供 SPC、WPC、LVT、强化地板及灵活的 OEM / ODM 解决方案。",
  alternates: {
    canonical: "/",
    languages: localizedAlternates(),
  },
  openGraph: {
    title: "TOOYEI 专业地板系统",
    description: "为全球市场打造可靠地板，提供结构化产品体系、OEM 开发与出口协作支持。",
    url: "/",
    locale: "zh_CN",
  },
};

export const dynamic = "force-dynamic";
export default async function Page() {
  let hasLanguagePreference = true;
  let crawler = true;
  let recommendedLocale: Locale = "zh";
  try {
    const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
    hasLanguagePreference = cookieStore.has(LANGUAGE_COOKIE) || cookieStore.has(LANGUAGE_PROMPT_COOKIE);
    crawler = isSearchCrawler(requestHeaders.get("user-agent"));
    recommendedLocale = detectPreferredLocale(requestHeaders.get("accept-language"));
  } catch (error) {
    logError("Home request preferences unavailable; safe defaults used", { operation: "page.home.preferences" }, error);
  }

  return (
    <>
      {!hasLanguagePreference && !crawler ? <LanguageRecommendationBanner locale={recommendedLocale} /> : null}
      <HomePage locale="zh" />
    </>
  );
}

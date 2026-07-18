import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightsPage } from "@/components/insights-page";
import { insightsCopy } from "@/lib/insights-copy";
import { isLocale, localizedAlternates, localizedPath, locales, openGraphLocales, toContentLocale } from "@/lib/site";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = insightsCopy[toContentLocale(locale)];
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: localizedPath(locale, "/insights"), languages: localizedAlternates("/insights") },
    openGraph: { type: "website", title: copy.seoTitle, description: copy.seoDescription, url: localizedPath(locale, "/insights"), locale: openGraphLocales[locale] },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <InsightsPage locale={locale} />;
}

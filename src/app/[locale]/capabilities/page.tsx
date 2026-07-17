import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CapabilitiesPage } from "@/components/capabilities-page";
import { capabilitiesCopy, capabilityMedia } from "@/lib/capabilities";
import { isLocale, locales, localizedAlternates, openGraphLocales } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const content = capabilitiesCopy[locale].hub;

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical: `/${locale}/capabilities`,
      languages: localizedAlternates("/capabilities"),
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: `/${locale}/capabilities`,
      locale: openGraphLocales[locale],
      images: [{ url: capabilityMedia["quality-inspection"].hero, alt: content.title }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CapabilitiesPage locale={locale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CapabilityDetailPage } from "@/components/capability-detail-page";
import {
  capabilitiesCopy,
  capabilityMedia,
  capabilitySlugs,
  isCapabilitySlug,
} from "@/lib/capabilities";
import { isLocale, locales, localizedAlternates, openGraphLocales } from "@/lib/site";

export function generateStaticParams() {
  return locales.flatMap((locale) => capabilitySlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCapabilitySlug(slug)) return {};
  const content = capabilitiesCopy[locale].pages[slug];
  const path = `/capabilities/${slug}`;

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: localizedAlternates(path),
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: `/${locale}${path}`,
      locale: openGraphLocales[locale],
      images: [{ url: capabilityMedia[slug].hero, alt: content.title }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCapabilitySlug(slug)) notFound();
  return <CapabilityDetailPage locale={locale} slug={slug} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CapabilityDetailPage } from "@/components/capability-detail-page";
import {
  capabilitiesCopy,
  capabilityMedia,
  capabilitySlugs,
  isCapabilitySlug,
} from "@/lib/capabilities";
import { localizedAlternates } from "@/lib/site";
import { safeMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return capabilitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return safeMetadata("metadata.capabilities.detail.zh", async () => {
  const { slug = "" } = await params;
  if (!isCapabilitySlug(slug)) return {};
  const content = capabilitiesCopy.zh.pages[slug];
  const path = `/capabilities/${slug}`;

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: { canonical: path, languages: localizedAlternates(path) },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: path,
      locale: "zh_CN",
      images: [{ url: capabilityMedia[slug].hero, alt: content.title }],
    },
  };
  }, { title: "TOOYEI 制造能力" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCapabilitySlug(slug)) notFound();
  return <CapabilityDetailPage locale="zh" slug={slug} />;
}

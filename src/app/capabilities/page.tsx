import type { Metadata } from "next";

import { CapabilitiesPage } from "@/components/capabilities-page";
import { capabilitiesCopy, capabilityMedia } from "@/lib/capabilities";
import { localizedAlternates } from "@/lib/site";

const content = capabilitiesCopy.zh.hub;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: content.seoTitle,
  description: content.seoDescription,
  alternates: { canonical: "/capabilities", languages: localizedAlternates("/capabilities") },
  openGraph: {
    title: content.seoTitle,
    description: content.seoDescription,
    url: "/capabilities",
    locale: "zh_CN",
    images: [{ url: capabilityMedia["quality-inspection"].hero, alt: content.title }],
  },
};

export default function Page() {
  return <CapabilitiesPage locale="zh" />;
}

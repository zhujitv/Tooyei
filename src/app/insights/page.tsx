import type { Metadata } from "next";
import { InsightsPage } from "@/components/insights-page";
import { insightsCopy } from "@/lib/insights-copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: insightsCopy.zh.seoTitle,
  description: insightsCopy.zh.seoDescription,
  alternates: { canonical: "/zh/insights" },
};

export default function Page() { return <InsightsPage locale="zh" />; }

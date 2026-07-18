import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "使用条款", description: "TOOYEI 网站使用条款，包含网站内容、知识产权、使用限制和责任边界。" };

export default function TermsPage() {
  return <PolicyPage kind="terms" locale="zh" />;
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "隐私政策", description: "了解 TOOYEI 如何处理客户咨询、项目沟通与网站访问相关信息。" };

export default function PrivacyPage() {
  return <PolicyPage kind="privacy" locale="zh" />;
}

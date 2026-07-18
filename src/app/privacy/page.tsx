import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "隐私政策", description: "TOOYEI 官网隐私政策与业务咨询信息处理说明。" };

export default function PrivacyPage() {
  return <PolicyPage kind="privacy" />;
}

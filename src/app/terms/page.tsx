import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "使用条款", description: "TOOYEI 官网基础使用条款。" };

export default function TermsPage() {
  return <PolicyPage kind="terms" />;
}

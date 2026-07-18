import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cookies 说明", description: "TOOYEI 官网 Cookie 与本地存储技术说明。" };

export default function CookiesPage() {
  return <PolicyPage kind="cookies" />;
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cookies 说明", description: "TOOYEI Cookies 说明，包含必要功能、偏好设置、浏览器管理和联系方式。" };

export default function CookiesPage() {
  return <PolicyPage kind="cookies" locale="zh" />;
}

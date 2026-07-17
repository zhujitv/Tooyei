import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const metadata: Metadata = {
  title: "TOOYEI 专业地板系统与 OEM / ODM 解决方案",
  description: "面向进口商、经销商、工程项目与自有品牌客户，提供 SPC、WPC、LVT、强化地板及灵活的 OEM / ODM 解决方案。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TOOYEI 专业地板系统",
    description: "为全球市场打造可靠地板，提供结构化产品体系、OEM 开发与出口协作支持。",
    url: "/",
    locale: "zh_CN",
  },
};

export const dynamic = "force-dynamic";
export default function Page() { return <HomePage locale="zh" />; }

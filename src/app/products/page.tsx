import type { Metadata } from "next";
import { ProductsPage } from "@/components/products-page";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SPC、WPC 与 LVT 地板产品", description: "浏览 Tooyei 面向批发、商业和 OEM 项目的 SPC、WPC 与 LVT 地板产品。" };
export default function Page() { return <ProductsPage locale="zh"/>; }

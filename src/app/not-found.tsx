import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FAFC] px-5 text-center text-[#111827]">
      <div>
        <p className="brand-eyebrow">404</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">页面不存在</h1>
        <p className="mt-5 text-base leading-7 text-[#475569]">您访问的页面可能已移动、删除或地址输入有误。</p>
        <Button asChild className="mt-8 site-accent-button">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </main>
  );
}

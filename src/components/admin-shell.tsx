import Link from "next/link";
import { BookOpen, LayoutDashboard, LogOut, MessageSquare, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/login/actions";

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111411] text-white">
      <header className="border-b border-white/10 bg-[#151815]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin/content" className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-sm bg-[#a63429] text-xs font-black">TY</span><span className="font-semibold">Tooyei 后台</span></Link>
            <nav className="hidden items-center gap-5 md:flex">
              <Link href="/admin/content" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><LayoutDashboard className="size-4" />总览</Link>
              <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><Package className="size-4" />产品</Link>
              <Link href="/admin/inquiries" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><MessageSquare className="size-4" />询盘</Link>
              <span className="inline-flex items-center gap-2 text-sm text-white/25"><BookOpen className="size-4" />文章</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/40 sm:inline">{session.email}</span>
            <form action={logoutAction}><Button type="submit" size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white"><LogOut />退出</Button></form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

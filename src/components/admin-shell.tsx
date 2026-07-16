import Link from "next/link";
import { BookOpen, LayoutDashboard, LogOut, MessageSquare, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/login/actions";

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(182,138,76,0.16),transparent_34%),linear-gradient(135deg,#070b14,#0b1020_48%,#111827)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin/content" className="flex items-center gap-3">
              <span className="brand-mark size-9 text-xs">TY</span>
              <span>
                <span className="block font-semibold tracking-tight">Tooyei 控制台</span>
                <span className="block text-[0.62rem] uppercase tracking-[0.24em] text-white/35">Operations</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1 md:flex">
              <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/65 hover:bg-white/10 hover:text-white"><LayoutDashboard className="size-4" />总览</Link>
              <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/65 hover:bg-white/10 hover:text-white"><Package className="size-4" />产品</Link>
              <Link href="/admin/inquiries" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/65 hover:bg-white/10 hover:text-white"><MessageSquare className="size-4" />询盘</Link>
              <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/65 hover:bg-white/10 hover:text-white"><Users className="size-4" />用户</Link>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/25"><BookOpen className="size-4" />文章</span>
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

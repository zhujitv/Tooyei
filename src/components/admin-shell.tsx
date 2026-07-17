import Link from "next/link";
import { BookOpen, LayoutDashboard, LogOut, MessageSquare, Package, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/login/actions";

const navItems = [
  { href: "/admin/content", label: "总览", description: "内容与翻译进度", icon: LayoutDashboard },
  { href: "/admin/products", label: "产品", description: "目录、发布、结构化资料", icon: Package },
  { href: "/admin/inquiries", label: "询盘", description: "客户线索与跟进", icon: MessageSquare },
  { href: "/admin/users", label: "用户", description: "账号、角色、密码", icon: Users },
] as const;

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#060a12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,138,76,0.18),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.1),transparent_28%)]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#080d17]/90 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-6">
            <Link href="/admin/content" className="flex items-center gap-3">
              <span className="brand-mark size-11 text-sm">TY</span>
              <span>
                <span className="block text-lg font-semibold tracking-[-0.03em]">Tooyei 控制台</span>
                <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.24em] text-white/35">Operations Suite</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-2 p-4" aria-label="后台导航">
            {navItems.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-white/60 transition hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-[#d6b36a] transition group-hover:bg-[#b68a4c] group-hover:text-[#0b1220]">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/35">{description}</span>
                </span>
              </Link>
            ))}
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-white/25">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.035]">
                <BookOpen className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">文章</span>
                <span className="mt-1 block text-xs leading-5">下一阶段开放</span>
              </span>
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <ShieldCheck className="size-4 text-[#d6b36a]" />
                当前账号
              </div>
              <p className="mt-2 break-all font-mono text-xs text-white/70">{session.email}</p>
              <form action={logoutAction} className="mt-4">
                <Button type="submit" size="sm" variant="ghost" className="w-full justify-start text-white/60 hover:bg-white/10 hover:text-white">
                  <LogOut />
                  退出登录
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080d17]/85 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="brand-mark size-9 text-xs">TY</span>
              <span>
                <span className="block text-sm font-semibold">Tooyei 控制台</span>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-white/35">Operations</span>
              </span>
            </div>
            <nav className="hidden items-center gap-1 md:flex lg:hidden" aria-label="后台移动导航">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-mono text-xs text-white/45 sm:inline">
                {session.email}
              </span>
              <form action={logoutAction} className="lg:hidden">
                <Button type="submit" size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white">
                  <LogOut />
                  退出
                </Button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

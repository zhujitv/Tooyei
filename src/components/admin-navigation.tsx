"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/content", label: "工作台", icon: LayoutDashboard },
  { href: "/admin/products", label: "产品", icon: Package },
  { href: "/admin/inquiries", label: "询盘", icon: MessageSquare },
  { href: "/admin/users", label: "团队与权限", icon: Users },
] as const;

const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function NavigationLinks({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <nav className="space-y-1" aria-label="后台导航">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors",
              active
                ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200",
              mobile && "h-11 text-sm",
            )}
          >
            <Icon className={cn("size-4", active ? "text-zinc-100" : "text-zinc-600 group-hover:text-zinc-400")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountPanel({ email, compact = false }: { email: string; compact?: boolean }) {
  return (
    <div className={cn("border-t border-white/[0.07] p-3", compact && "mt-auto")}>
      <div className="flex items-center gap-3 rounded-lg p-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
          {email.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-200">管理员</p>
          <p className="truncate text-[11px] text-zinc-600">{email}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" size="icon-sm" variant="ghost" className="text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-200">
            <LogOut className="size-3.5" />
            <span className="sr-only">退出登录</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminNavigation({ email }: { email: string }) {
  const pathname = usePathname();
  const current = navItems.find((item) => isActivePath(pathname, item.href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-white/[0.07] bg-[#0c0c0e] lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-white/[0.07] px-4">
          <Link href="/admin/content" className="flex items-center gap-2.5" aria-label="Tooyei 后台首页">
            <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-[#df2029]">
              <Image src="/brand/tooyei-symbol.png" width={22} height={23} alt="" className="h-auto brightness-0 invert" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-zinc-100">Tooyei</span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">Workspace</p>
          <NavigationLinks pathname={pathname} />
          <div className="mt-7">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">System</p>
            <div className="flex h-9 items-center gap-3 rounded-md px-3 text-[13px] text-zinc-700">
              <Settings className="size-4" />
              系统设置
              <span className="ml-auto text-[9px] uppercase tracking-wider">Soon</span>
            </div>
          </div>
        </div>

        <AccountPanel email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-white/[0.07] bg-[#0a0a0b]/90 px-4 backdrop-blur-xl lg:pl-[calc(15rem+1.5rem)] lg:pr-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="mr-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white lg:hidden">
              <Menu />
              <span className="sr-only">打开导航</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-white/[0.08] bg-[#0c0c0e] p-0 text-white">
            <SheetHeader className="border-b border-white/[0.07] px-5 py-4 text-left">
              <SheetTitle className="text-zinc-100">Tooyei 管理后台</SheetTitle>
              <SheetDescription className="text-zinc-600">内容与销售运营工作区</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col p-3">
              <NavigationLinks pathname={pathname} mobile />
              <AccountPanel email={email} compact />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-600">Tooyei</span>
          <span className="text-zinc-800">/</span>
          <span className="font-medium text-zinc-300">{current?.label ?? "管理后台"}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 text-[11px] text-zinc-600 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            系统正常
          </span>
          <Button asChild size="sm" variant="ghost" className="text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200">
            <Link href="/" target="_blank">
              查看网站
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </header>
    </>
  );
}

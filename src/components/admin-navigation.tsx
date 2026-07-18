"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Languages,
  Images,
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
  { href: "/admin/translations", label: "翻译中心", icon: Languages },
  { href: "/admin/categories", label: "产品栏目", icon: FolderTree },
  { href: "/admin/media", label: "媒体中心", icon: Images },
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
              "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              mobile && "h-11",
            )}
          >
            <Icon className={cn("size-4", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountPanel({ email, compact = false }: { email: string; compact?: boolean }) {
  return (
    <div className={cn("border-t border-slate-200 p-3", compact && "mt-auto")}>
      <div className="flex items-center gap-3 rounded-lg p-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
          {email.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-900">管理员</p>
          <p className="truncate text-[11px] text-slate-500">{email}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" size="icon-sm" variant="ghost" className="text-slate-400 hover:bg-slate-100 hover:text-slate-900">
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link href="/admin/content" className="flex items-center gap-2.5" aria-label="Tooyei 后台首页">
            <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-[#df2029]">
              <Image src="/brand/tooyei-symbol.png" width={22} height={23} alt="" className="h-[23px] w-[22px] brightness-0 invert" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Tooyei</span>
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-500">Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          <NavigationLinks pathname={pathname} />
          <div className="mt-7">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">System</p>
            <div className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-400">
              <Settings className="size-4" />
              系统设置
              <span className="ml-auto text-[9px] uppercase tracking-wider">Soon</span>
            </div>
          </div>
        </div>

        <AccountPanel email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 text-slate-900 backdrop-blur-xl lg:pl-[calc(16rem+1.5rem)] lg:pr-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="mr-2 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#172033] lg:hidden">
              <Menu />
              <span className="sr-only">打开导航</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-slate-200 bg-white p-0 text-slate-900">
            <SheetHeader className="border-b border-slate-200 px-5 py-4 text-left">
              <SheetTitle className="text-slate-950">Tooyei 管理后台</SheetTitle>
              <SheetDescription className="text-slate-500">内容与销售运营工作区</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col p-3">
              <NavigationLinks pathname={pathname} mobile />
              <AccountPanel email={email} compact />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#667085]">Tooyei</span>
          <span className="text-[#D0D5DD]">/</span>
          <span className="font-medium text-[#172033]">{current?.label ?? "管理后台"}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 text-[11px] text-[#667085] sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            系统正常
          </span>
          <Button asChild size="sm" variant="ghost" className="text-[#667085] hover:bg-[#F2F4F7] hover:text-[#172033]">
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

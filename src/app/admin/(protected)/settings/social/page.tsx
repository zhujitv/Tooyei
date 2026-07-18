import Link from "next/link";
import { Share2 } from "lucide-react";
import { AdminSocialLinkManager } from "@/components/admin-social-link-manager";
import { requireProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminSocialLinks } from "@/lib/repositories/social-links";

export const dynamic = "force-dynamic";

export default async function SocialSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireProductManagerSession();
  const [links, feedback] = await Promise.all([getAdminSocialLinks(), searchParams]);
  const successMessage = feedback.success === "created" ? "社媒链接已新增。" : feedback.success === "updated" ? "社媒链接已更新。" : feedback.success === "deleted" ? "社媒链接已删除。" : null;

  return (
    <main className="admin-page space-y-6">
      <header>
        <p className="text-sm text-slate-500">系统设置 / 官网渠道</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-950"><Share2 className="size-6 text-blue-600" />社媒链接管理</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">统一管理官网页头、页脚、首页和联系页面展示的社媒按钮。支持新增、修改、隐藏、排序和删除。</p>
        <Link href="/admin/settings" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:text-blue-800">返回系统设置中心</Link>
      </header>
      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}
      {feedback.error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{feedback.error}</div> : null}
      <AdminSocialLinkManager links={links} databaseReady={isDatabaseConfigured()} />
    </main>
  );
}

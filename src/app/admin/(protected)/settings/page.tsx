import { Settings } from "lucide-react";
import { AdminSiteSettingsForm } from "@/components/admin-site-settings-form";
import { requireProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminSiteSettings } from "@/lib/repositories/site-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireProductManagerSession();
  const [settings, feedback] = await Promise.all([getAdminSiteSettings(), searchParams]);

  return (
    <main className="admin-page space-y-6">
      <header>
        <p className="text-sm text-slate-500">系统设置 / 网站配置</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-950"><Settings className="size-6 text-blue-600" />系统设置中心</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">统一管理网站属性、SEO 默认信息、联系方式、运营开关和官网渠道。</p>
      </header>
      {feedback.success === "updated" ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">系统设置已保存。</div> : null}
      {feedback.error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{feedback.error}</div> : null}
      <AdminSiteSettingsForm settings={settings} databaseReady={isDatabaseConfigured()} />
    </main>
  );
}

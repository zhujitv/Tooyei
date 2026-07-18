import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BookOpen, Bot, Clock3, Languages, Plus, Search, TriangleAlert } from "lucide-react";
import { ContentStatus, TranslationStatus } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminArticleDashboard } from "@/lib/repositories/admin-articles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "文章与 SEO 增长中心", robots: { index: false, follow: false } };

const localeMeta = {
  EN: ["🇬🇧", "英"], DE: ["🇩🇪", "德"], FR: ["🇫🇷", "法"], ES: ["🇪🇸", "西"], RU: ["🇷🇺", "俄"],
  JA: ["🇯🇵", "日"], IT: ["🇮🇹", "意"], AR: ["🇸🇦", "阿"], ZH: ["🇨🇳", "中"],
} as const;
const articleStatusLabel: Record<ContentStatus, string> = { DRAFT: "草稿", PUBLISHED: "已发布", ARCHIVED: "已归档" };
const jobStatusLabel: Record<string, string> = {
  PENDING: "待处理", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL_FAILED: "部分失败", FAILED: "失败",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string }>;
}) {
  const filters = await searchParams;
  const status = Object.values(ContentStatus).includes(filters.status as ContentStatus) ? filters.status as ContentStatus : undefined;
  const dashboard = await getAdminArticleDashboard({ query: filters.q, status });
  const workerHealthy = dashboard.worker.staleItems === 0 && dashboard.worker.failedItems === 0;

  return (
    <main className="admin-page">
      <header className="flex flex-col gap-4 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#667085]">内容管理 / 国际 SEO</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">文章与 SEO 增长中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">以英文为内容源，统一管理九语言文章、AI 翻译、发布状态、结构化数据与搜索收录。</p>
        </div>
        <Button asChild className="bg-[#172033] text-white hover:bg-[#27334a]"><Link href="/admin/articles/new"><Plus className="size-4" />新建文章</Link></Button>
      </header>

      {filters.error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><TriangleAlert className="size-4" /><AlertTitle>操作失败</AlertTitle><AlertDescription>{filters.error}</AlertDescription></Alert> : null}
      {dashboard.source === "sample" ? <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-900"><TriangleAlert className="size-4" /><AlertTitle>数据库未连接</AlertTitle><AlertDescription>连接 PostgreSQL 后才能创建和发布文章。</AlertDescription></Alert> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="文章指标">
        {[
          { label: "文章总数", value: dashboard.total, Icon: BookOpen, detail: "全部内容资产" },
          { label: "已发布", value: dashboard.published, Icon: Activity, detail: "公开可访问" },
          { label: "草稿", value: dashboard.drafts, Icon: Clock3, detail: "仍在编辑" },
          { label: "缺少英文源", value: dashboard.missingEnglish, Icon: Languages, detail: "需优先补齐" },
        ].map(({ label, value, Icon, detail }) => (
          <article key={label} className="admin-card p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-[#667085]">{label}</span><Icon className="size-4 text-[#98A2B3]" /></div>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#172033]">{value}</p>
            <p className="mt-1 text-xs text-[#98A2B3]">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 admin-card p-5" aria-labelledby="worker-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className={`grid size-9 place-items-center rounded-lg ${workerHealthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Bot className="size-4" /></span>
            <div><h2 id="worker-title" className="text-sm font-semibold text-[#172033]">文章翻译 Worker</h2><p className="mt-1 text-xs text-[#667085]">每分钟处理一个语言任务；失败任务自动退避重试，心跳超过 5 分钟会自动恢复。</p></div>
          </div>
          <div className="grid grid-cols-4 gap-5 text-center text-xs">
            <p><span className="block text-base font-semibold text-[#344054]">{dashboard.worker.pendingItems}</span><span className="text-[#98A2B3]">排队</span></p>
            <p><span className="block text-base font-semibold text-blue-700">{dashboard.worker.runningItems}</span><span className="text-[#98A2B3]">执行</span></p>
            <p><span className="block text-base font-semibold text-rose-700">{dashboard.worker.failedItems}</span><span className="text-[#98A2B3]">24h 失败</span></p>
            <p><span className="block text-base font-semibold text-amber-700">{dashboard.worker.staleItems}</span><span className="text-[#98A2B3]">超时</span></p>
          </div>
        </div>
        {dashboard.worker.jobs.length ? (
          <div className="mt-4 grid gap-2 border-t border-[#EAECF0] pt-4 lg:grid-cols-2">
            {dashboard.worker.jobs.slice(0, 4).map((job) => (
              <Link href={`/admin/articles/${job.article.id}`} key={job.id} className="flex items-center justify-between rounded-lg border border-[#EAECF0] px-3 py-2.5 hover:bg-[#F9FAFB]">
                <div className="min-w-0"><p className="truncate text-xs font-medium text-[#344054]">{job.article.translations[0]?.title || job.article.slug}</p><p className="mt-0.5 truncate font-mono text-[10px] text-[#98A2B3]">{job.model}</p></div>
                <Badge variant="outline" className="ml-3 border-[#D0D5DD] bg-white text-[10px] text-[#667085]">{jobStatusLabel[job.status] ?? job.status} · {job.completedItems}/{job.totalItems}</Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-5 admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E4E7EC] p-4 md:flex-row md:items-center md:justify-between">
          <form className="flex flex-1 gap-2" action="/admin/articles">
            <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" /><Input name="q" defaultValue={filters.q} placeholder="搜索标题或 Slug" className="pl-9" /></div>
            <select name="status" defaultValue={status ?? ""} className="admin-select h-10 min-w-28 px-3"><option value="">全部状态</option>{Object.values(ContentStatus).map((value) => <option key={value} value={value}>{articleStatusLabel[value]}</option>)}</select>
            <Button type="submit" variant="outline">筛选</Button>
          </form>
          <p className="text-xs text-[#98A2B3]">最多显示最近更新的 100 篇</p>
        </div>

        {dashboard.rows.length ? (
          <div className="divide-y divide-[#EAECF0]">
            {dashboard.rows.map((article) => (
              <article key={article.id} className="grid gap-4 p-4 transition hover:bg-[#FCFCFD] lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)_160px_110px] lg:items-center">
                <div className="flex min-w-0 gap-3">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-[#EAECF0] bg-[#F2F4F7] bg-cover bg-center" style={article.coverImage ? { backgroundImage: `url(${JSON.stringify(article.coverImage)})` } : undefined} />
                  <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-[#172033]">{article.displayTitle}</h2>{article.featured ? <Badge className="bg-amber-50 text-amber-700">推荐</Badge> : null}</div><p className="mt-1 truncate font-mono text-[11px] text-[#98A2B3]">/{article.slug}</p><p className="mt-1 text-xs text-[#667085]">{article.kind} · 更新于 {article.updatedAt.toLocaleDateString("zh-CN")}</p></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs"><span className="text-[#667085]">九语言发布</span><span className="font-medium text-[#344054]">{article.publishedLocaleCount}/9</span></div>
                  <div className="flex flex-wrap gap-1.5">{Object.entries(localeMeta).map(([locale, meta]) => { const value = article.localeStatuses[locale as keyof typeof article.localeStatuses]; return <span key={locale} title={`${locale} · ${value}`} className={`grid size-7 place-items-center rounded-md border text-[10px] font-semibold ${value === TranslationStatus.PUBLISHED ? "border-emerald-200 bg-emerald-50 text-emerald-700" : value === TranslationStatus.MISSING ? "border-rose-100 bg-rose-50 text-rose-600" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{meta[1]}</span>; })}</div>
                </div>
                <div><Badge variant="outline" className={article.status === ContentStatus.PUBLISHED ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#D0D5DD] bg-white text-[#667085]"}>{articleStatusLabel[article.status]}</Badge>{!article.hasEnglishContent ? <p className="mt-2 text-xs font-medium text-rose-600">英文内容未创建</p> : null}</div>
                <Button asChild variant="outline" size="sm"><Link href={`/admin/articles/${article.id}`}>编辑文章</Link></Button>
              </article>
            ))}
          </div>
        ) : <div className="px-6 py-16 text-center"><BookOpen className="mx-auto size-8 text-[#D0D5DD]" /><p className="mt-3 text-sm font-semibold text-[#344054]">暂无文章</p><p className="mt-1 text-xs text-[#98A2B3]">创建第一篇英文源文章后，可一键生成其他八种语言。</p></div>}
      </section>
    </main>
  );
}

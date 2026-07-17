import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  Languages,
  ListFilter,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ProductKind, TranslationJobStatus } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getTranslationDashboard,
  getTranslationProductOptions,
  getTranslationServiceState,
  getTranslationServiceStates,
  translationLocales,
} from "@/lib/repositories/product-translation-jobs";
import { createTranslationJobAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "翻译中心", robots: { index: false, follow: false } };

const localeMeta = {
  EN: ["🇬🇧", "英语"],
  DE: ["🇩🇪", "德语"],
  FR: ["🇫🇷", "法语"],
  ES: ["🇪🇸", "西班牙语"],
  RU: ["🇷🇺", "俄语"],
  JA: ["🇯🇵", "日语"],
  IT: ["🇮🇹", "意大利语"],
  AR: ["🇸🇦", "阿拉伯语"],
  ZH: ["🇨🇳", "中文"],
} as const;

const kindLabels: Record<ProductKind, string> = {
  SPC: "SPC 石塑地板",
  ESPC: "ESPC 地板",
  VSPC: "VSPC 地板",
  LSPC: "LSPC 地板",
  WPC: "WPC 地板",
  LVT: "LVT 地板",
  LAMINATE: "强化地板",
  WALL_PANEL: "墙板",
  ACCESSORY: "配件",
};

const jobLabel: Record<TranslationJobStatus, string> = {
  QUEUED: "等待执行",
  RUNNING: "执行中",
  COMPLETED: "已完成",
  PARTIAL: "部分失败",
  FAILED: "执行失败",
  CANCELLED: "已取消",
};

const statusTone: Record<TranslationJobStatus, string> = {
  QUEUED: "bg-slate-100 text-slate-600",
  RUNNING: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const dateTime = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function TranslationCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const filters = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const defaultService = getTranslationServiceState();
  const services = getTranslationServiceStates();
  const configuredServices = services.filter((service) => service.configured && service.provider);
  const selectedProvider = defaultService.configured && defaultService.provider
    ? defaultService.provider
    : configuredServices[0]?.provider;
  const [dashboard, products] = await Promise.all([
    getTranslationDashboard(),
    getTranslationProductOptions(filters.q),
  ]);

  return (
    <main className="admin-page">
      <header className="flex flex-col gap-4 border-b border-[#E4E7EC] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <span>内容管理</span><span>/</span><span>九语言工作流</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">产品翻译中心</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#667085]">批量生成产品主内容、SEO 与结构化资料，机器结果统一进入草稿，由运营人员审核后发布。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2 text-xs text-[#475467]">
            <Database className="size-3.5" />{databaseReady ? "数据库已连接" : "数据库未连接"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2 text-xs text-[#475467]">
            <Bot className="size-3.5" />{configuredServices.length}/{services.length} 个翻译引擎可用
          </span>
        </div>
      </header>

      {filters.error ? (
        <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800">
          <TriangleAlert className="size-4" />
          <AlertTitle>任务创建失败</AlertTitle>
          <AlertDescription>{filters.error}</AlertDescription>
        </Alert>
      ) : null}
      {!configuredServices.length ? (
        <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-900">
          <TriangleAlert className="size-4" />
          <AlertTitle>需要配置翻译 Provider</AlertTitle>
          <AlertDescription>OpenAI 或豆包至少需要配置一个可用的 API Key。任务数据和现有产品不受影响。</AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="语言覆盖率">
        {translationLocales.map((locale) => {
          const current = dashboard.coverage[locale];
          const covered = dashboard.totalProducts ? Math.round(((current.ready + current.review) / dashboard.totalProducts) * 100) : 0;
          return (
            <article key={locale} className="admin-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>{localeMeta[locale][0]}</span>
                  <div><h2 className="text-sm font-semibold text-[#172033]">{localeMeta[locale][1]}</h2><p className="mt-0.5 text-xs text-[#98A2B3]">{locale}</p></div>
                </div>
                <span className="text-sm font-semibold text-[#344054]">{covered}%</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EAECF0]">
                <div className="h-full rounded-full bg-[#667085]" style={{ width: `${covered}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <p><span className="block font-semibold text-emerald-700">{current.ready}</span><span className="text-[#98A2B3]">已发布</span></p>
                <p><span className="block font-semibold text-violet-700">{current.review}</span><span className="text-[#98A2B3]">待审核</span></p>
                <p><span className="block font-semibold text-amber-700">{current.missing}</span><span className="text-[#98A2B3]">缺失</span></p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)]">
        <article className="admin-card p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700"><Sparkles className="size-4" /></span>
            <div><h2 className="text-base font-semibold">创建翻译批次</h2><p className="mt-1 text-sm text-[#667085]">默认只补缺失语言；已发布内容始终跳过，不会自动覆盖。</p></div>
          </div>

          <form action={createTranslationJobAction} className="mt-5 space-y-5">
            <fieldset>
              <legend className="admin-label">翻译引擎</legend>
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                {services.map((service) => (
                  <label
                    key={service.provider}
                    className={`relative rounded-lg border px-3.5 py-3 transition-colors ${
                      service.configured
                        ? "cursor-pointer border-[#D0D5DD] bg-white hover:border-[#98A2B3]"
                        : "cursor-not-allowed border-[#EAECF0] bg-[#F9FAFB] opacity-70"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="provider"
                        value={service.provider ?? ""}
                        required
                        disabled={!service.configured}
                        defaultChecked={service.provider === selectedProvider}
                        className="mt-1 size-4 accent-[#25344F]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#344054]">{service.providerLabel}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${service.configured ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {service.configured ? "可用" : "待配置"}
                          </span>
                        </span>
                        <span className="mt-1 block truncate font-mono text-[11px] text-[#667085]">{service.model || "未设置模型"}</span>
                        <span className="mt-1 block truncate text-[11px] text-[#98A2B3]">
                          {service.configured ? service.baseUrl : service.error || service.baseUrl}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#98A2B3]">任务会永久记录所选引擎和模型；API Key 仅保存在服务端环境变量中。</p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="source-locale" className="admin-label">源语言</Label>
                <select id="source-locale" name="sourceLocale" defaultValue="EN" className="admin-select h-10 w-full px-3">
                  {translationLocales.map((locale) => <option key={locale} value={locale}>{localeMeta[locale][0]} {localeMeta[locale][1]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scope" className="admin-label">生成范围</Label>
                <select id="scope" name="scope" defaultValue="MISSING" className="admin-select h-10 w-full px-3">
                  <option value="MISSING">仅缺失译文</option>
                  <option value="NON_PUBLISHED">全部未发布译文（重新生成草稿）</option>
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="admin-label">目标语言</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {translationLocales.map((locale) => (
                  <label key={locale} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E4E7EC] bg-[#FCFCFD] px-3 py-2.5 text-sm text-[#344054] transition-colors hover:bg-white">
                    <input type="checkbox" name="targetLocales" value={locale} defaultChecked={locale !== "EN"} className="admin-checkbox" />
                    <span>{localeMeta[locale][0]} {localeMeta[locale][1]}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#98A2B3]">执行时会自动排除与源语言相同的选项。</p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="kind" className="admin-label">产品类型（可选）</Label>
                <select id="kind" name="kind" defaultValue="" className="admin-select h-10 w-full px-3">
                  <option value="">全部产品类型</option>
                  {Object.values(ProductKind).map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-limit" className="admin-label">本批最多产品数</Label>
                <Input id="product-limit" name="productLimit" type="number" min={1} max={50} defaultValue={10} className="admin-field h-10" />
              </div>
            </div>

            <details className="rounded-lg border border-[#E4E7EC] bg-[#FCFCFD]">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-[#344054]"><ListFilter className="size-4" />指定产品（可选）<span className="ml-auto text-xs font-normal text-[#98A2B3]">未勾选时按上方筛选</span></summary>
              <div className="border-t border-[#E4E7EC] p-3">
                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {products.map((product) => {
                    const title = product.translations.find(({ locale }) => locale === "ZH")?.title ?? product.translations.find(({ locale }) => locale === "EN")?.title ?? product.slug;
                    return (
                      <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-white">
                        <input type="checkbox" name="productIds" value={product.id} className="admin-checkbox" />
                        <span className="font-mono text-xs text-[#667085]">{product.sku}</span>
                        <span className="min-w-0 flex-1 truncate text-[#344054]">{title}</span>
                        <span className="text-xs text-[#98A2B3]">{product.kind}</span>
                      </label>
                    );
                  })}
                  {!products.length ? <p className="px-2 py-5 text-center text-sm text-[#98A2B3]">没有找到可选产品。</p> : null}
                </div>
              </div>
            </details>

            <Button type="submit" disabled={!databaseReady || !configuredServices.length} className="bg-[#25344F] text-white hover:bg-[#172033]">
              <Sparkles className="size-4" />创建可恢复翻译任务
            </Button>
          </form>
        </article>

        <article className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
            <div><h2 className="text-base font-semibold">最近任务</h2><p className="mt-1 text-xs text-[#98A2B3]">点击任务查看逐项进度与错误。</p></div>
            <Languages className="size-4 text-[#98A2B3]" />
          </div>
          <div className="divide-y divide-[#EAECF0]">
            {dashboard.jobs.map((job) => {
              const finished = job.completedItems + job.failedItems + job.skippedItems;
              const progress = job.totalItems ? Math.round((finished / job.totalItems) * 100) : 0;
              return (
                <Link key={job.id} href={`/admin/translations/${job.id}`} className="group block px-5 py-4 transition-colors hover:bg-[#F9FAFB]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[job.status]}`}>{jobLabel[job.status]}</span>
                        <span className="text-xs text-[#667085]">{localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[1] ?? job.sourceLocale} → {job.targetLocales.length} 种语言</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-[#344054]">{job.provider} · {job.model}</p>
                      <p className="mt-1 text-xs text-[#98A2B3]">{dateTime.format(job.createdAt)} · {job.requestedBy?.name ?? job.requestedBy?.email ?? "管理员"}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-[#98A2B3] group-hover:text-[#344054]" />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAECF0]"><div className="h-full rounded-full bg-[#667085]" style={{ width: `${progress}%` }} /></div>
                    <span className="w-12 text-right text-xs font-medium text-[#667085]">{finished}/{job.totalItems}</span>
                  </div>
                </Link>
              );
            })}
            {!dashboard.jobs.length ? (
              <div className="px-5 py-14 text-center"><Clock3 className="mx-auto size-5 text-[#D0D5DD]" /><p className="mt-3 text-sm text-[#98A2B3]">还没有翻译任务。</p></div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          [CheckCircle2, "不覆盖已发布内容", "任何已发布译文在执行前都会再次校验并跳过。"],
          [Search, "内置 SEO 约束", "每种语言单独生成标题和描述，并提示超长内容。"],
          [Clock3, "中断后可继续", "任务和明细持久化保存，页面关闭后可从未完成项继续。"],
        ].map(([Icon, title, description]) => (
          <div key={String(title)} className="flex gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4">
            <Icon className="mt-0.5 size-4 shrink-0 text-[#667085]" />
            <div><h3 className="text-sm font-medium text-[#344054]">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-[#98A2B3]">{String(description)}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}

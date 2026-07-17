import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileWarning,
  Languages,
  RotateCcw,
} from "lucide-react";
import { TranslationJobItemStatus, TranslationJobStatus } from "@/generated/prisma/client";
import { TranslationJobRunner } from "@/components/translation-job-runner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getProductTranslationJob, getTranslationServiceState } from "@/lib/repositories/product-translation-jobs";
import { retryTranslationJobAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "翻译任务", robots: { index: false, follow: false } };

const localeMeta = {
  EN: ["🇬🇧", "英语"], DE: ["🇩🇪", "德语"], FR: ["🇫🇷", "法语"], ES: ["🇪🇸", "西班牙语"],
  RU: ["🇷🇺", "俄语"], JA: ["🇯🇵", "日语"], IT: ["🇮🇹", "意大利语"], AR: ["🇸🇦", "阿拉伯语"], ZH: ["🇨🇳", "中文"],
} as const;

const jobLabels: Record<TranslationJobStatus, string> = {
  QUEUED: "等待执行", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL: "部分失败", FAILED: "执行失败", CANCELLED: "已取消",
};
const itemLabels: Record<TranslationJobItemStatus, string> = {
  QUEUED: "等待", RUNNING: "执行中", COMPLETED: "已生成", FAILED: "失败", SKIPPED: "已跳过",
};
const itemTone: Record<TranslationJobItemStatus, string> = {
  QUEUED: "bg-slate-100 text-slate-600", RUNNING: "bg-violet-50 text-violet-700", COMPLETED: "bg-emerald-50 text-emerald-700", FAILED: "bg-rose-50 text-rose-700", SKIPPED: "bg-amber-50 text-amber-700",
};

const formatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const warningList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export default async function TranslationJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const [job, service] = await Promise.all([getProductTranslationJob(id), Promise.resolve(getTranslationServiceState())]);
  if (!job) notFound();

  const finished = job.completedItems + job.failedItems + job.skippedItems;
  const warnings = job.items.reduce((sum, item) => sum + warningList(item.warnings).length, 0);
  const canRetry = job.failedItems > 0;
  const metrics = [
    { label: "总任务项", value: job.totalItems, icon: Languages },
    { label: "已完成", value: job.completedItems, icon: CheckCircle2 },
    { label: "失败", value: job.failedItems, icon: AlertCircle },
    { label: "质检提示", value: warnings, icon: FileWarning },
    { label: "Token", value: job.inputTokens + job.outputTokens, icon: Bot },
  ];

  return (
    <main className="admin-page">
      <Button asChild size="sm" variant="ghost" className="-ml-2 text-[#667085] hover:bg-[#EAECF0] hover:text-[#172033]"><Link href="/admin/translations"><ArrowLeft />返回翻译中心</Link></Button>

      <header className="mt-4 flex flex-col gap-5 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
            <span className="rounded-full bg-[#EAECF0] px-2 py-0.5 font-medium text-[#344054]">{jobLabels[job.status]}</span>
            <span>{localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[0]} {localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[1] ?? job.sourceLocale}</span>
            <span>→</span><span>{job.targetLocales.length} 种目标语言</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">翻译任务</h1>
          <p className="mt-2 font-mono text-xs text-[#98A2B3]">{job.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
          <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2"><Bot className="size-3.5" />{job.provider} · {job.model}</span>
          <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2"><Clock3 className="size-3.5" />{formatter.format(job.createdAt)}</span>
        </div>
      </header>

      {feedback.saved === "retry" ? <Alert className="mt-5 border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-4" /><AlertTitle>失败项已重新排队</AlertTitle><AlertDescription>点击继续执行即可重新处理。</AlertDescription></Alert> : null}
      {feedback.error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><AlertCircle className="size-4" /><AlertTitle>操作失败</AlertTitle><AlertDescription>{feedback.error}</AlertDescription></Alert> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-card p-4"><div className="flex items-center justify-between"><span className="text-xs text-[#667085]">{label}</span><Icon className="size-3.5 text-[#98A2B3]" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[#172033]">{value.toLocaleString()}</p></div>
        ))}
      </section>

      <section className="mt-5">
        <TranslationJobRunner
          jobId={job.id}
          configured={service.configured}
          initial={{ status: job.status, totalItems: job.totalItems, completedItems: job.completedItems, failedItems: job.failedItems, skippedItems: job.skippedItems }}
        />
      </section>

      {canRetry ? (
        <form action={retryTranslationJobAction} className="mt-3 flex justify-end">
          <input type="hidden" name="jobId" value={job.id} />
          <Button type="submit" variant="outline"><RotateCcw className="size-4" />将 {job.failedItems} 个失败项重新排队</Button>
        </form>
      ) : null}

      <section className="admin-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4"><div><h2 className="text-base font-semibold">任务明细</h2><p className="mt-1 text-xs text-[#98A2B3]">{finished}/{job.totalItems} 已处理；机器译文仍需人工审核发布。</p></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#F9FAFB] text-xs text-[#667085]"><tr><th className="px-5 py-3 font-medium">产品</th><th className="px-4 py-3 font-medium">目标语言</th><th className="px-4 py-3 font-medium">状态</th><th className="px-4 py-3 font-medium">质检 / 错误</th><th className="px-4 py-3 font-medium">用量</th><th className="px-5 py-3 text-right font-medium">操作</th></tr></thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {job.items.map((item) => {
                const title = item.product.translations.find(({ locale }) => locale === item.targetLocale)?.title ?? item.product.translations.find(({ locale }) => locale === job.sourceLocale)?.title ?? item.productSlug;
                const itemWarnings = warningList(item.warnings);
                return (
                  <tr key={item.id} className="align-top hover:bg-[#FCFCFD]">
                    <td className="px-5 py-4"><p className="max-w-xs truncate font-medium text-[#344054]">{title}</p><p className="mt-1 font-mono text-xs text-[#98A2B3]">{item.productSku}</p></td>
                    <td className="px-4 py-4 text-[#475467]">{localeMeta[item.targetLocale as keyof typeof localeMeta]?.[0]} {localeMeta[item.targetLocale as keyof typeof localeMeta]?.[1] ?? item.targetLocale}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${itemTone[item.status]}`}>{itemLabels[item.status]}</span><p className="mt-2 text-xs text-[#98A2B3]">尝试 {item.attempts} 次</p></td>
                    <td className="max-w-md px-4 py-4">
                      {item.error ? <p className="line-clamp-3 text-xs leading-5 text-rose-700">{item.error}</p> : itemWarnings.length ? <ul className="space-y-1 text-xs leading-5 text-amber-700">{itemWarnings.slice(0, 3).map((warning) => <li key={warning}>• {warning}</li>)}</ul> : <span className="text-xs text-[#98A2B3]">—</span>}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#667085]">{(item.inputTokens + item.outputTokens).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right"><Button asChild size="sm" variant="ghost" className="text-[#475467] hover:bg-[#EAECF0]"><Link href={`/admin/products/${item.productSlug}?tab=languages`}><span>人工审核</span><ArrowUpRight className="size-3.5" /></Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

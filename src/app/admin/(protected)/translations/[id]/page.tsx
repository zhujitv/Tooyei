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
} from "lucide-react";
import { TranslationJobItemStatus } from "@/generated/prisma/client";
import { TranslationJobActions } from "@/components/translation-job-actions";
import { TranslationJobRunner } from "@/components/translation-job-runner";
import { TranslationLiveRefresh } from "@/components/translation-live-refresh";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getProductManagerSession } from "@/lib/admin-auth";
import { getProductTranslationJob, getTranslationServiceState } from "@/lib/repositories/product-translation-jobs";
import { normalizeTranslationResult } from "@/lib/translation-response-parser";
import { getTranslationItemExecutionStatus, getTranslationJobExecutionStatus } from "@/lib/translation-execution-status";
import {
  isTranslationProcessingStep,
  translationProcessingStepLabels,
  type TranslationExecutionStatus,
} from "@/lib/translation-worker-config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "翻译任务", robots: { index: false, follow: false } };

const localeMeta = {
  EN: ["🇬🇧", "英语"], DE: ["🇩🇪", "德语"], FR: ["🇫🇷", "法语"], ES: ["🇪🇸", "西班牙语"],
  RU: ["🇷🇺", "俄语"], JA: ["🇯🇵", "日语"], IT: ["🇮🇹", "意大利语"], AR: ["🇸🇦", "阿拉伯语"], ZH: ["🇨🇳", "中文"],
} as const;

const executionLabels: Record<TranslationExecutionStatus, string> = {
  PENDING: "PENDING · 待处理", QUEUED: "QUEUED · 已排队", PROCESSING: "PROCESSING · 执行中", SUCCESS: "SUCCESS · 已完成", FAILED: "FAILED · 失败", RETRYING: "RETRYING · 重试中", CANCELLED: "CANCELLED · 已取消",
};
const itemTone: Record<TranslationExecutionStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600", QUEUED: "bg-blue-50 text-blue-700", PROCESSING: "bg-violet-50 text-violet-700", SUCCESS: "bg-emerald-50 text-emerald-700", FAILED: "bg-rose-50 text-rose-700", RETRYING: "bg-amber-50 text-amber-700", CANCELLED: "bg-slate-100 text-slate-500",
};

const formatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const warningList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export default async function TranslationJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; run?: string }>;
}) {
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const [job, productManager] = await Promise.all([getProductTranslationJob(id), getProductManagerSession()]);
  if (!job) notFound();
  const service = getTranslationServiceState(job.provider);

  const finished = job.completedItems + job.failedItems + job.skippedItems + job.cancelledItems;
  const pendingItems = job.items.filter((item) => item.status === TranslationJobItemStatus.PENDING).length;
  const runningItems = job.items.filter((item) => item.status === TranslationJobItemStatus.RUNNING).length;
  const retryingItems = job.items.filter((item) => item.status === TranslationJobItemStatus.PENDING && item.retryCount > 0).length;
  const executionStatus = getTranslationJobExecutionStatus({ status: job.status, startedAt: job.startedAt, runningItems, retryingItems });
  const warnings = job.items.reduce((sum, item) => sum + warningList(item.warnings).length, 0);
  const metrics = [
    { label: "总任务项", value: job.totalItems, icon: Languages },
    { label: "已完成", value: job.completedItems, icon: CheckCircle2 },
    { label: "失败", value: job.failedItems, icon: AlertCircle },
    { label: "质检提示", value: warnings, icon: FileWarning },
    { label: "Token", value: job.totalTokens?.toLocaleString() ?? "—", icon: Bot },
  ];

  return (
    <main className="admin-page">
      <TranslationLiveRefresh active={executionStatus === "PENDING" || executionStatus === "QUEUED" || executionStatus === "PROCESSING" || executionStatus === "RETRYING"} />
      <Button asChild size="sm" variant="ghost" className="-ml-2 text-[#667085] hover:bg-[#EAECF0] hover:text-[#172033]"><Link href="/admin/translations"><ArrowLeft />返回翻译中心</Link></Button>

      <header className="mt-4 flex flex-col gap-5 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
            <span className="rounded-full bg-[#EAECF0] px-2 py-0.5 font-medium text-[#344054]">{executionLabels[executionStatus]}</span>
            <span>{localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[0]} {localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[1] ?? job.sourceLocale}</span>
            <span>→</span><span>{job.targetLocales.length} 种目标语言</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">翻译任务</h1>
          <p className="mt-2 font-mono text-xs text-[#98A2B3]">{job.id}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#667085]">
            <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2"><Bot className="size-3.5" />{job.provider} · {job.model}</span>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2"><Clock3 className="size-3.5" />{formatter.format(job.createdAt)}</span>
          </div>
          <TranslationJobActions jobId={job.id} status={job.status} failedItems={job.failedItems} canDelete={Boolean(productManager)} />
        </div>
      </header>

      {feedback.saved === "retry" ? <Alert className="mt-5 border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-4" /><AlertTitle>失败项已重新排队</AlertTitle><AlertDescription>点击“继续执行未完成任务”即可重新处理。</AlertDescription></Alert> : null}
      {feedback.error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><AlertCircle className="size-4" /><AlertTitle>操作失败</AlertTitle><AlertDescription>{feedback.error}</AlertDescription></Alert> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-card p-4"><div className="flex items-center justify-between"><span className="text-xs text-[#667085]">{label}</span><Icon className="size-3.5 text-[#98A2B3]" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[#172033]">{typeof value === "number" ? value.toLocaleString() : value}</p></div>
        ))}
      </section>

      <section className="mt-5">
        <TranslationJobRunner
          jobId={job.id}
          configured={service.configured}
          autoStart={feedback.run === "1"}
          initial={{ status: executionStatus, totalItems: job.totalItems, completedItems: job.completedItems, failedItems: job.failedItems, skippedItems: job.skippedItems, cancelledItems: job.cancelledItems, pendingItems, runningItems, retryingItems }}
        />
      </section>

      <section className="mt-3 flex flex-wrap items-center gap-2" aria-label="结构化翻译内容类型">
        <span className="text-xs font-medium text-[#667085]">结构化内容：</span>
        {job.contentTypes.map((type) => <span key={type} className="rounded-md border border-[#E4E7EC] bg-white px-2 py-1 font-mono text-[11px] text-[#475467]">{type}</span>)}
      </section>

      <section className="admin-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4"><div><h2 className="text-base font-semibold">任务明细</h2><p className="mt-1 text-xs text-[#98A2B3]">{finished}/{job.totalItems} 已处理；机器译文仍需人工审核发布。</p></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#F9FAFB] text-xs text-[#667085]"><tr><th className="px-5 py-3 font-medium">产品</th><th className="px-4 py-3 font-medium">目标语言</th><th className="px-4 py-3 font-medium">状态</th><th className="px-4 py-3 font-medium">质检 / 错误</th><th className="px-4 py-3 font-medium">用量</th><th className="px-5 py-3 text-right font-medium">操作</th></tr></thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {job.items.map((item) => {
                const title = item.product.translations.find(({ locale }) => locale === item.targetLocale)?.title ?? item.product.translations.find(({ locale }) => locale === job.sourceLocale)?.title ?? item.productSlug;
                const itemWarnings = warningList(item.warnings);
                const normalizedOutput = item.output ? normalizeTranslationResult(item.output) : null;
                const itemExecutionStatus = getTranslationItemExecutionStatus(item);
                const currentStep = isTranslationProcessingStep(item.processingStep)
                  ? translationProcessingStepLabels[item.processingStep]
                  : "等待队列";
                return (
                  <tr key={item.id} className="align-top hover:bg-[#FCFCFD]">
                    <td className="px-5 py-4"><p className="max-w-xs truncate font-medium text-[#344054]">{title}</p><p className="mt-1 font-mono text-xs text-[#98A2B3]">{item.productSku}</p></td>
                    <td className="px-4 py-4 text-[#475467]">{localeMeta[item.targetLocale as keyof typeof localeMeta]?.[0]} {localeMeta[item.targetLocale as keyof typeof localeMeta]?.[1] ?? item.targetLocale}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${itemTone[itemExecutionStatus]}`}>{executionLabels[itemExecutionStatus]}</span><p className="mt-2 text-xs text-[#667085]">当前步骤：{currentStep}</p><p className="mt-1 text-xs text-[#98A2B3]">总尝试 {item.attemptCount} 次 · 自动重试 {item.retryCount}/3</p></td>
                    <td className="max-w-md px-4 py-4">
                      {item.errorMessage ? <p className="line-clamp-3 text-xs leading-5 text-rose-700">{item.errorMessage}</p> : itemWarnings.length ? <ul className="space-y-1 text-xs leading-5 text-amber-700">{itemWarnings.slice(0, 3).map((warning) => <li key={warning}>• {warning}</li>)}</ul> : <span className="text-xs text-[#98A2B3]">—</span>}
                      {item.logs.length ? (
                        <details className="mt-2 rounded-md border border-[#E4E7EC] bg-[#FCFCFD] text-left">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[#475467]">查看错误详情与执行记录</summary>
                          <div className="max-h-96 space-y-3 overflow-y-auto border-t border-[#E4E7EC] p-3">
                            {normalizedOutput ? (
                              <article className="rounded-md bg-white p-3 text-xs text-[#475467]">
                                <p className="font-medium text-[#344054]">规范化翻译结果</p>
                                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-[#101828] p-3 font-mono text-[11px] leading-5 text-white/75">{JSON.stringify(normalizedOutput, null, 2)}</pre>
                              </article>
                            ) : null}
                            {item.logs.map((log) => (
                              <article key={log.id} className="rounded-md bg-white p-3 text-xs text-[#475467]">
                                <div className="grid gap-1 sm:grid-cols-2">
                                  <p><span className="text-[#98A2B3]">类型：</span>{log.errorType ?? "成功"}</p>
                                  <p><span className="text-[#98A2B3]">模型：</span>{log.provider} · {log.model}</p>
                                  <p><span className="text-[#98A2B3]">尝试：</span>{log.attemptNumber}</p>
                                  <p><span className="text-[#98A2B3]">耗时：</span>{log.durationMs.toLocaleString()} ms</p>
                                  <p><span className="text-[#98A2B3]">Token：</span>{log.totalTokens?.toLocaleString() ?? "—"}</p>
                                  <p><span className="text-[#98A2B3]">时间：</span>{formatter.format(log.requestFinishedAt)}</p>
                                </div>
                                {log.errorMessage ? <p className="mt-2 whitespace-pre-wrap text-rose-700">{log.errorMessage}</p> : null}
                                {log.errorType && log.rawResponse ? <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded bg-[#101828] p-3 font-mono text-[11px] leading-5 text-white/75">{log.rawResponse}</pre> : null}
                              </article>
                            ))}
                          </div>
                        </details>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#667085]">{item.totalTokens?.toLocaleString() ?? "—"}</td>
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

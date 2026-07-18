import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  FileWarning,
  Languages,
} from "lucide-react";
import { TranslationJobItemStatus } from "@/generated/prisma/client";
import { TranslationJobActions } from "@/components/translation-job-actions";
import { TranslationItemActions } from "@/components/translation-item-actions";
import { TranslationJobRunner } from "@/components/translation-job-runner";
import { TranslationLiveRefresh } from "@/components/translation-live-refresh";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getProductManagerSession } from "@/lib/admin-auth";
import { calculateProductLocaleCompleteness, type ProductLocaleCompletenessInput } from "@/lib/product-locale-completeness";
import { getProductTranslationJob, getTranslationServiceState } from "@/lib/repositories/product-translation-jobs";
import { normalizeTranslationResult, type NormalizedTranslationResult } from "@/lib/translation-response-parser";
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
  PENDING: "admin-badge-neutral", QUEUED: "admin-badge-neutral border-blue-200 bg-blue-50 text-blue-700", PROCESSING: "admin-badge-ai", SUCCESS: "admin-badge-success", FAILED: "admin-badge-missing", RETRYING: "admin-badge-review", CANCELLED: "admin-badge-neutral",
};

const formatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const warningList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const qaIssueList = (value: unknown) => Array.isArray(value)
  ? value.filter((item): item is { code: string; severity: "INFO" | "WARNING" | "ERROR"; field: string; message: string } => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const row = item as Record<string, unknown>;
      return typeof row.code === "string" && typeof row.field === "string" && typeof row.message === "string"
        && (row.severity === "INFO" || row.severity === "WARNING" || row.severity === "ERROR");
    })
  : [];

const qaLabels: Record<string, string> = {
  QA_PASSED: "质检通过",
  QA_WARNING: "已完成，有轻微提示",
  QA_FAILED: "质检失败",
  NEEDS_REVIEW: "需要人工处理",
};

const qaTones: Record<string, string> = {
  QA_PASSED: "admin-badge-success",
  QA_WARNING: "admin-badge-review",
  QA_FAILED: "admin-badge-missing",
  NEEDS_REVIEW: "admin-badge-missing",
};

type JobProduct = NonNullable<Awaited<ReturnType<typeof getProductTranslationJob>>>["items"][number]["product"];

const toCompletenessInput = (product: JobProduct): ProductLocaleCompletenessInput => {
  const translationMap = <T extends { locale: string }>(rows: T[]) => Object.fromEntries(rows.map((row) => [
    String(row.locale).toLowerCase(),
    Object.fromEntries(Object.entries(row).filter(([key]) => key !== "locale")),
  ]));
  return {
    translations: product.translations.map((row) => ({ ...row, locale: row.locale.toLowerCase() })),
    media: product.media.map((row) => ({ visible: row.visible, translations: translationMap(row.translations) })),
    features: product.features.map((row) => ({
      visible: row.visible,
      translations: Object.fromEntries(row.translations.map((translation) => [translation.locale.toLowerCase(), { title: translation.value, description: translation.description }])),
    })),
    specifications: product.specifications.map((row) => ({ visible: row.visible, value: row.value, unit: row.unit, translations: translationMap(row.translations) })),
    applications: product.applications.map((row) => ({ visible: row.visible, translations: translationMap(row.translations) })),
    downloads: product.downloads.map((row) => ({ visible: row.visible, translations: translationMap(row.translations) })),
  };
};

function TranslationOutputSummary({ output }: { output: NormalizedTranslationResult }) {
  const groups = [
    ["媒体", output.media.length],
    ["卖点", output.features.length],
    ["参数", output.specifications.length],
    ["应用", output.applications.length],
    ["下载", output.downloads.length],
  ] as const;
  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-xs text-[#475569]">
      <div className="flex items-center justify-between gap-3"><p className="font-semibold text-[#111827]">翻译结果摘要</p><span className="admin-badge-ai">AI 生成</span></div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-[#94A3B8]">产品标题</dt><dd className="mt-1 font-medium text-[#111827]">{output.product.title || "—"}</dd></div>
        <div><dt className="text-[#94A3B8]">SEO 标题</dt><dd className="mt-1 font-medium text-[#111827]">{output.product.seoTitle || "—"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-[#94A3B8]">摘要</dt><dd className="mt-1 leading-5">{output.product.summary || "—"}</dd></div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">{groups.map(([label, count]) => <span key={label} className="admin-badge-neutral">{label} {count}</span>)}</div>
    </article>
  );
}

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

  const finished = job.completedItems + job.failedItems + job.qaFailedItems + job.needsReviewItems + job.skippedItems + job.cancelledItems;
  const pendingItems = job.items.filter((item) => item.status === TranslationJobItemStatus.PENDING).length;
  const runningItems = job.items.filter((item) => item.status === TranslationJobItemStatus.RUNNING || item.status === TranslationJobItemStatus.TRANSLATED).length;
  const retryingItems = job.items.filter((item) => item.status === TranslationJobItemStatus.PENDING && item.retryCount > 0).length;
  const executionStatus = getTranslationJobExecutionStatus({ status: job.status, startedAt: job.startedAt, runningItems, retryingItems });
  const metrics = [
    { label: "总任务项", value: job.totalItems, icon: Languages },
    { label: "质检通过", value: job.qaPassedItems, icon: CheckCircle2 },
    { label: "有提示", value: job.qaWarningItems, icon: FileWarning },
    { label: "质检失败", value: job.qaFailedItems, icon: AlertCircle },
    { label: "执行失败", value: job.failedItems, icon: AlertCircle },
    { label: "需人工审核", value: job.needsReviewItems, icon: FileWarning },
    { label: "Token", value: job.totalTokens?.toLocaleString() ?? "—", icon: Bot },
  ];

  return (
    <main className="admin-page">
      <TranslationLiveRefresh active={executionStatus === "PENDING" || executionStatus === "QUEUED" || executionStatus === "PROCESSING" || executionStatus === "RETRYING"} />
      <Button asChild size="sm" variant="ghost" className="-ml-2 text-[#667085] hover:bg-[#EAECF0] hover:text-[#172033]"><Link href="/admin/translations"><ArrowLeft />返回翻译中心</Link></Button>

      <header className="mt-4 flex flex-col gap-5 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
            <span className={itemTone[executionStatus]}>{executionLabels[executionStatus]}</span>
            <span>{localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[0]} {localeMeta[job.sourceLocale as keyof typeof localeMeta]?.[1] ?? job.sourceLocale}</span>
            <span>→</span><span>{job.targetLocales.length} 种目标语言</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">翻译任务</h1>
          <p className="mt-2 font-mono text-xs text-[#98A2B3]">{job.id}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#667085]">
            <span className="admin-badge-ai gap-2 rounded-md font-mono"><Bot className="size-3.5" />{job.provider} · {job.model}</span>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#E4E7EC] bg-white px-3 py-2"><Clock3 className="size-3.5" />{formatter.format(job.createdAt)}</span>
          </div>
          <TranslationJobActions jobId={job.id} status={job.status} failedItems={job.failedItems + job.qaFailedItems + job.needsReviewItems} canDelete={Boolean(productManager)} />
        </div>
      </header>

      {feedback.saved === "retry" ? <Alert className="mt-5 border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-4" /><AlertTitle>失败项已重新排队</AlertTitle><AlertDescription>点击“继续执行未完成任务”即可重新处理。</AlertDescription></Alert> : null}
      {feedback.error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><AlertCircle className="size-4" /><AlertTitle>操作失败</AlertTitle><AlertDescription>{feedback.error}</AlertDescription></Alert> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-card p-4"><div className="flex items-center justify-between"><span className="text-xs text-[#667085]">{label}</span><Icon className="size-3.5 text-[#98A2B3]" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[#172033]">{typeof value === "number" ? value.toLocaleString() : value}</p></div>
        ))}
      </section>

      <section className="mt-5">
        <TranslationJobRunner
          jobId={job.id}
          configured={service.configured}
          autoStart={feedback.run === "1"}
          initial={{ status: executionStatus, totalItems: job.totalItems, completedItems: job.completedItems, failedItems: job.failedItems, skippedItems: job.skippedItems, cancelledItems: job.cancelledItems, qaPassedItems: job.qaPassedItems, qaWarningItems: job.qaWarningItems, qaFailedItems: job.qaFailedItems, needsReviewItems: job.needsReviewItems, pendingItems, runningItems, retryingItems }}
        />
      </section>

      <section className="mt-3 flex flex-wrap items-center gap-2" aria-label="结构化翻译内容类型">
        <span className="text-xs font-medium text-[#667085]">结构化内容：</span>
        {job.contentTypes.map((type) => <span key={type} className="rounded-md border border-[#E4E7EC] bg-white px-2 py-1 font-mono text-[11px] text-[#475467]">{type}</span>)}
      </section>

      <section className="admin-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4"><div><h2 className="text-base font-semibold">任务明细</h2><p className="mt-1 text-xs text-[#98A2B3]">{finished}/{job.totalItems} 已处理；机器译文仍需人工审核发布。</p></div></div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[900px] text-left text-sm">
            <thead className="bg-[#F9FAFB] text-xs text-[#667085]"><tr><th className="px-5 py-3 font-medium">产品</th><th className="px-4 py-3 font-medium">目标语言</th><th className="px-4 py-3 font-medium">状态</th><th className="px-4 py-3 font-medium">质检 / 错误</th><th className="px-4 py-3 font-medium">用量</th><th className="px-5 py-3 text-right font-medium">操作</th></tr></thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {job.items.map((item) => {
                const title = item.product.translations.find(({ locale }) => locale === item.targetLocale)?.title ?? item.product.translations.find(({ locale }) => locale === job.sourceLocale)?.title ?? item.productSlug;
                const itemWarnings = warningList(item.warnings);
                const itemQaIssues = qaIssueList(item.qaIssues);
                const normalizedOutput = item.output ? normalizeTranslationResult(item.output) : null;
                const itemExecutionStatus = getTranslationItemExecutionStatus(item);
                const currentQaStatus = item.qaStatus || (["QA_PASSED", "QA_WARNING", "QA_FAILED", "NEEDS_REVIEW"].includes(item.status) ? item.status : null);
                const legacyCompleted = item.status === TranslationJobItemStatus.COMPLETED && !item.qaVersion;
                const statusLabel = currentQaStatus
                  ? qaLabels[currentQaStatus] ?? currentQaStatus
                  : legacyCompleted ? "旧版完成 · 未执行新版 QA" : executionLabels[itemExecutionStatus];
                const statusClass = currentQaStatus
                  ? qaTones[currentQaStatus] ?? "admin-badge-neutral"
                  : legacyCompleted ? "admin-badge-neutral" : itemTone[itemExecutionStatus];
                const currentStep = isTranslationProcessingStep(item.processingStep)
                  ? translationProcessingStepLabels[item.processingStep]
                  : "等待队列";
                const localeCompleteness = calculateProductLocaleCompleteness(toCompletenessInput(item.product), item.targetLocale.toLowerCase());
                return (
                  <tr key={item.id} className="align-top hover:bg-[#FCFCFD]">
                    <td className="px-5 py-4"><p className="max-w-xs truncate font-medium text-[#344054]">{title}</p><p className="mt-1 font-mono text-xs text-[#98A2B3]">{item.productSku}</p></td>
                    <td className="px-4 py-4 text-[#475467]">{localeMeta[item.targetLocale as keyof typeof localeMeta]?.[0]} {localeMeta[item.targetLocale as keyof typeof localeMeta]?.[1] ?? item.targetLocale}</td>
                    <td className="px-4 py-4">
                      <span className={statusClass}>{statusLabel}</span>
                      <p className="mt-2 text-xs text-[#475569]">当前步骤：{currentStep}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">模型尝试 {item.attemptCount} 次 · 自动重试 {item.retryCount}/2 · QA {item.qaAttemptCount} 次</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">资料完整度 {localeCompleteness.percentage}% · {item.savedAt ? "已保存草稿" : "未保存"}</p>
                    </td>
                    <td className="max-w-md px-4 py-4">
                      {itemQaIssues.length ? (
                        <ul className="space-y-1 text-xs leading-5">
                          {itemQaIssues.slice(0, 5).map((qaIssue, index) => (
                            <li key={`${qaIssue.code}-${qaIssue.field}-${index}`} className={qaIssue.severity === "ERROR" ? "text-rose-700" : qaIssue.severity === "WARNING" ? "text-amber-700" : "text-blue-700"}>
                              <span className="font-medium">{qaIssue.field}</span> · {qaIssue.message}
                            </li>
                          ))}
                        </ul>
                      ) : item.errorMessage ? <p className="line-clamp-3 text-xs leading-5 text-rose-700">{item.errorMessage}</p> : itemWarnings.length ? <ul className="space-y-1 text-xs leading-5 text-amber-700">{itemWarnings.slice(0, 3).map((warning) => <li key={warning}>• {warning}</li>)}</ul> : <span className="text-xs text-[#98A2B3]">—</span>}
                      {item.logs.length ? (
                        <details className="mt-2 rounded-md border border-[#E4E7EC] bg-[#FCFCFD] text-left">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[#475467]">查看错误详情与执行记录</summary>
                          <div className="max-h-96 space-y-3 overflow-y-auto border-t border-[#E4E7EC] p-3">
                            {normalizedOutput ? <TranslationOutputSummary output={normalizedOutput} /> : null}
                            {item.logs.map((log) => (
                              <article key={log.id} className="rounded-md bg-white p-3 text-xs text-[#475467]">
                                <div className="grid gap-1 sm:grid-cols-2">
                                  <p><span className="text-[#98A2B3]">类型：</span>{log.qaStatus ? qaLabels[log.qaStatus] ?? log.qaStatus : log.errorType ?? "模型调用成功"}</p>
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
                    <td className="px-5 py-4 text-right"><TranslationItemActions jobId={job.id} itemId={item.id} productSlug={item.productSlug} canRevalidate={item.status !== TranslationJobItemStatus.RUNNING && item.status !== TranslationJobItemStatus.TRANSLATED && item.status !== TranslationJobItemStatus.PENDING} canRetry={([TranslationJobItemStatus.FAILED, TranslationJobItemStatus.QA_FAILED, TranslationJobItemStatus.NEEDS_REVIEW] as TranslationJobItemStatus[]).includes(item.status)} /></td>
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "radix-ui";
import { LoaderCircle, Pause, Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

type Progress = {
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  cancelledItems: number;
  qaPassedItems: number;
  qaWarningItems: number;
  qaFailedItems: number;
  needsReviewItems: number;
  pendingItems: number;
  runningItems: number;
  retryingItems: number;
};

type RunResponse = {
  ok: boolean;
  error?: string;
  result?: { processed: boolean; executionId: string; error?: string; retrying?: boolean; nextRunAt?: string | null; job: Progress & { executionStatus?: string } };
};

const terminalStatuses = new Set(["SUCCESS", "FAILED", "CANCELLED"]);
const resumableStatuses = new Set(["PENDING", "QUEUED", "FAILED", "CANCELLED"]);
const wait = (durationMs: number) => new Promise((resolve) => window.setTimeout(resolve, durationMs));

export function TranslationJobRunner({
  jobId,
  configured,
  initial,
  autoStart = false,
}: {
  jobId: string;
  configured: boolean;
  initial: Progress;
  autoStart?: boolean;
}) {
  const router = useRouter();
  const continueRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [progress, setProgress] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  const finished = progress.completedItems + progress.failedItems + progress.qaFailedItems + progress.needsReviewItems + progress.skippedItems + progress.cancelledItems;
  const modelPercent = progress.totalItems ? Math.round((finished / progress.totalItems) * 100) : 0;
  const qaAccepted = progress.qaPassedItems + progress.qaWarningItems;
  const qaPercent = progress.totalItems ? Math.round((qaAccepted / progress.totalItems) * 100) : 0;
  const hasUnfinished = progress.completedItems + progress.skippedItems + progress.cancelledItems < progress.totalItems;
  const canRun = configured && hasUnfinished && resumableStatuses.has(progress.status) && !running && !stopping;
  const canStop = progress.status === "PROCESSING" || progress.status === "RETRYING" || running;

  const run = useCallback(async () => {
    if (running || stopping || !configured || !hasUnfinished) return;
    continueRef.current = true;
    setRunning(true);
    setMessage(null);

    let current = progress;
    let executionId: string | undefined;
    try {
      while (continueRef.current && !terminalStatuses.has(current.status)) {
        const response = await fetchWithRetry(`/admin/api/translation-jobs/${jobId}/run`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(executionId ? { executionId } : {}),
        });
        const body = (await response.json().catch(() => null)) as RunResponse | null;
        if (!response.ok || !body?.ok || !body.result) {
          throw new Error(body?.error || `执行请求失败（HTTP ${response.status}）。`);
        }
        executionId = body.result.executionId;
        current = { ...body.result.job, status: body.result.job.executionStatus ?? body.result.job.status };
        setProgress(current);
        if (body.result.error) {
          setMessage(body.result.retrying
            ? `一项任务暂时失败，已自动进入重试队列：${body.result.error}`
            : `一项任务失败：${body.result.error}；其余待处理项目将继续。`);
        }
        if (terminalStatuses.has(current.status)) break;
        if (!body.result.processed) {
          if (!body.result.nextRunAt) break;
          const remainingMs = new Date(body.result.nextRunAt).getTime() - Date.now();
          await wait(Math.max(1_000, Math.min(30_000, remainingMs)));
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "翻译任务执行失败。");
    } finally {
      continueRef.current = false;
      setRunning(false);
      router.refresh();
    }
  }, [configured, hasUnfinished, jobId, progress, router, running, stopping]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current || !canRun) return;
    autoStartedRef.current = true;
    void run();
  }, [autoStart, canRun, run]);

  const stop = async () => {
    if (stopping) return;
    continueRef.current = false;
    setStopping(true);
    setMessage(null);
    try {
      const response = await fetchWithRetry(`/admin/api/translation-jobs/${jobId}`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "STOP" }),
      });
      const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) throw new Error(body?.error || "停止任务失败。");
      setProgress((current) => ({ ...current, status: "CANCELLED", runningItems: 0 }));
      setStopOpen(false);
      setMessage("任务已停止，当前正在处理的单项可能仍会完成。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "停止任务失败。");
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#D0D5DD] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#344054]">模型执行进度</span>
            <span className="font-mono text-xs text-[#667085]">{finished} / {progress.totalItems} · {modelPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAECF0]">
            <div className="h-full rounded-full bg-[#25344F] transition-[width] duration-300" style={{ width: `${modelPercent}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#344054]">质量验收进度</span><span className="font-mono text-xs text-[#667085]">{qaAccepted} / {progress.totalItems} · {qaPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAECF0]"><div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${qaPercent}%` }} /></div>
          <p className="mt-2 text-xs text-[#667085]">质检通过 {progress.qaPassedItems} · 有提示 {progress.qaWarningItems} · 质检失败 {progress.qaFailedItems} · 需人工审核 {progress.needsReviewItems} · 执行失败 {progress.failedItems}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canStop ? (
            <AlertDialog.Root open={stopOpen} onOpenChange={setStopOpen}>
              <AlertDialog.Trigger asChild>
                <Button type="button" variant="outline" disabled={stopping}><Pause className="size-4" />停止执行</Button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#101828]/40 backdrop-blur-[2px]" />
                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-2xl">
                  <AlertDialog.Title className="text-lg font-semibold text-[#172033]">确认停止该翻译任务？</AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#667085]">任务停止后不会再领取新项目，当前正在处理的单项可能仍会完成。</AlertDialog.Description>
                  <div className="mt-6 flex justify-end gap-2">
                    <AlertDialog.Cancel asChild><Button type="button" variant="outline">取消</Button></AlertDialog.Cancel>
                    <Button type="button" onClick={stop} disabled={stopping} className="bg-[#B42318] text-white hover:bg-[#912018]">
                      {stopping ? <LoaderCircle className="size-4 animate-spin" /> : <Pause className="size-4" />}停止任务
                    </Button>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          ) : (
            <Button id="translation-run-button" type="button" onClick={run} disabled={!canRun} className="bg-[#25344F] text-white hover:bg-[#172033]">
              {finished ? <RefreshCw className="size-4" /> : <Play className="size-4" />}
              {finished ? "继续执行未完成任务" : "开始执行"}
            </Button>
          )}
          {running ? <span className="inline-flex items-center gap-2 px-2 text-xs text-violet-700"><LoaderCircle className="size-4 animate-spin" />正在处理</span> : null}
        </div>
      </div>
      {!configured ? <p className="mt-3 text-xs text-amber-700">配置翻译 Provider 和 API 密钥后才能运行；当前任务已安全保存在数据库。</p> : null}
      {message ? <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{message}</p> : null}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Progress = {
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
};

type RunResponse = {
  ok: boolean;
  error?: string;
  result?: { processed: boolean; error?: string; job: Progress };
};

const terminalStatuses = new Set(["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]);

export function TranslationJobRunner({
  jobId,
  configured,
  initial,
}: {
  jobId: string;
  configured: boolean;
  initial: Progress;
}) {
  const router = useRouter();
  const continueRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  const finished = progress.completedItems + progress.failedItems + progress.skippedItems;
  const percent = progress.totalItems ? Math.round((finished / progress.totalItems) * 100) : 0;

  const stop = () => {
    continueRef.current = false;
    setRunning(false);
    setMessage("已暂停；当前请求完成后不会继续处理下一项。 ");
    router.refresh();
  };

  const run = async () => {
    if (running || !configured) return;
    continueRef.current = true;
    setRunning(true);
    setMessage(null);

    let current = progress;
    try {
      while (continueRef.current && !terminalStatuses.has(current.status)) {
        const response = await fetch(`/admin/api/translation-jobs/${jobId}/run`, {
          method: "POST",
          headers: { Accept: "application/json" },
        });
        const body = (await response.json().catch(() => null)) as RunResponse | null;
        if (!response.ok || !body?.ok || !body.result) {
          throw new Error(body?.error || `执行请求失败（HTTP ${response.status}）。`);
        }
        current = body.result.job;
        setProgress(current);
        if (body.result.error) setMessage(`一项任务失败：${body.result.error}；其余任务将继续。`);
        if (!body.result.processed || terminalStatuses.has(current.status)) break;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "翻译任务执行失败。 ");
    } finally {
      continueRef.current = false;
      setRunning(false);
      router.refresh();
    }
  };

  return (
    <div className="rounded-xl border border-[#D0D5DD] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#344054]">执行进度</span>
            <span className="font-mono text-xs text-[#667085]">{finished} / {progress.totalItems} · {percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAECF0]">
            <div className="h-full rounded-full bg-[#25344F] transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#667085]">完成 {progress.completedItems} · 跳过 {progress.skippedItems} · 失败 {progress.failedItems}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {running ? (
            <Button type="button" variant="outline" onClick={stop}><Pause className="size-4" />暂停</Button>
          ) : (
            <Button type="button" onClick={run} disabled={!configured || terminalStatuses.has(progress.status)} className="bg-[#25344F] text-white hover:bg-[#172033]">
              {finished ? <RefreshCw className="size-4" /> : <Play className="size-4" />}
              {finished ? "继续执行" : "开始执行"}
            </Button>
          )}
          {running ? <span className="inline-flex items-center gap-2 px-2 text-xs text-violet-700"><LoaderCircle className="size-4 animate-spin" />正在处理</span> : null}
        </div>
      </div>
      {!configured ? <p className="mt-3 text-xs text-amber-700">配置 OPENAI_API_KEY 后才能运行；当前任务已安全保存在数据库。</p> : null}
      {message ? <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{message}</p> : null}
    </div>
  );
}

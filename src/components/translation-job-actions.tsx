"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertDialog, DropdownMenu } from "radix-ui";
import {
  Archive,
  ArchiveRestore,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmAction = "STOP" | "CLOSE" | "DELETE";
type MutationAction = ConfirmAction | "REQUEUE_FAILED" | "RESTORE";

const runnableStatuses = new Set(["PENDING", "PAUSED", "CANCELLED", "FAILED", "PARTIAL_FAILED"]);

export function TranslationJobActions({
  jobId,
  status,
  failedItems,
  canDelete,
  mode = "toolbar",
}: {
  jobId: string;
  status: string;
  failedItems: number;
  canDelete: boolean;
  mode?: "toolbar" | "menu";
}) {
  const router = useRouter();
  const [pending, setPending] = useState<MutationAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mutate = async (action: MutationAction) => {
    if (pending) return;
    setPending(action);
    setMessage(null);
    try {
      const response = await fetch(`/admin/api/translation-jobs/${jobId}`, {
        method: action === "DELETE" ? "DELETE" : "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: action === "DELETE" ? undefined : JSON.stringify({ action }),
      });
      const body = await response.json().catch(() => null) as { ok?: boolean; error?: string; result?: { count?: number } } | null;
      if (!response.ok || !body?.ok) throw new Error(body?.error || "翻译任务操作失败。");
      setConfirmAction(null);
      if (action === "DELETE") {
        router.push("/admin/translations?saved=deleted");
        router.refresh();
        return;
      }
      setMessage(action === "REQUEUE_FAILED" ? `已重新排队 ${body.result?.count ?? 0} 个失败项。` : "操作已完成。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "翻译任务操作失败。");
    } finally {
      setPending(null);
    }
  };

  const available = {
    run: runnableStatuses.has(status),
    stop: mode === "menu" && status === "RUNNING",
    requeue: failedItems > 0 && status !== "RUNNING" && status !== "CLOSED",
    close: status !== "RUNNING" && status !== "CLOSED",
    restore: status === "CLOSED",
    delete: canDelete && status !== "RUNNING",
  };
  const showToolbar = available.requeue || available.close || available.restore || available.delete;

  const actionButtons = (
    <>
      {mode === "menu" ? <DropdownMenu.Item asChild><Link href={`/admin/translations/${jobId}`} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-[#F2F4F7]"><Eye className="size-4" />查看</Link></DropdownMenu.Item> : null}
      {mode === "menu" && available.run ? <DropdownMenu.Item asChild><Link href={`/admin/translations/${jobId}?run=1`} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-[#F2F4F7]"><Play className="size-4" />继续执行未完成任务</Link></DropdownMenu.Item> : null}
      {available.stop ? <button type="button" onClick={() => setConfirmAction("STOP")} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F2F4F7]"><Pause className="size-4" />停止</button> : null}
      {available.requeue ? <button type="button" onClick={() => void mutate("REQUEUE_FAILED")} disabled={Boolean(pending)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50"><RotateCcw className="size-4" />重新排队失败项</button> : null}
      {available.close ? <button type="button" onClick={() => setConfirmAction("CLOSE")} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F2F4F7]"><Archive className="size-4" />关闭任务</button> : null}
      {available.restore ? <button type="button" onClick={() => void mutate("RESTORE")} disabled={Boolean(pending)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50"><ArchiveRestore className="size-4" />恢复任务</button> : null}
      {available.delete ? <button type="button" onClick={() => setConfirmAction("DELETE")} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#B42318] hover:bg-[#FEF3F2]"><Trash2 className="size-4" />删除任务</button> : null}
    </>
  );

  const confirmation = confirmAction ? {
    STOP: { title: "确认停止该翻译任务？", description: "任务停止后不会再领取新项目，当前正在处理的单项可能仍会完成。", confirm: "停止任务" },
    CLOSE: { title: "确认关闭该翻译任务？", description: "关闭只会归档任务，不会删除明细、日志或已写入的产品译文。", confirm: "关闭任务" },
    DELETE: { title: "确认删除该翻译任务？", description: "将永久删除任务明细、执行记录和错误日志，此操作不可恢复。已经写入产品的多语言内容不会被删除。", confirm: "永久删除" },
  }[confirmAction] : null;

  return (
    <div className={mode === "toolbar" ? "flex flex-col items-end gap-2" : "relative"}>
      {mode === "menu" ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild><Button type="button" size="icon" variant="ghost" aria-label="翻译任务操作"><MoreHorizontal className="size-4" /></Button></DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="z-[90] min-w-52 rounded-lg border border-[#E4E7EC] bg-white p-1.5 text-[#344054] shadow-xl">{actionButtons}</DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : showToolbar ? (
        <div className="flex flex-wrap justify-end gap-2 rounded-xl border border-[#E4E7EC] bg-white p-2">{actionButtons}</div>
      ) : null}

      {pending ? <span className="inline-flex items-center gap-1.5 text-xs text-[#667085]"><LoaderCircle className="size-3.5 animate-spin" />正在处理</span> : null}
      {message ? <span className="max-w-md text-right text-xs text-[#667085]">{message}</span> : null}

      <AlertDialog.Root open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#101828]/40 backdrop-blur-[2px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-2xl">
            <AlertDialog.Title className="text-lg font-semibold text-[#172033]">{confirmation?.title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#667085]">{confirmation?.description}</AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild><Button type="button" variant="outline">取消</Button></AlertDialog.Cancel>
              <Button
                type="button"
                disabled={!confirmAction || Boolean(pending)}
                onClick={() => confirmAction && void mutate(confirmAction)}
                className={confirmAction === "DELETE" || confirmAction === "STOP" ? "bg-[#B42318] text-white hover:bg-[#912018]" : "bg-[#25344F] text-white hover:bg-[#172033]"}
              >
                {pending ? <LoaderCircle className="size-4 animate-spin" /> : confirmAction === "DELETE" ? <Trash2 className="size-4" /> : null}
                {confirmation?.confirm}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

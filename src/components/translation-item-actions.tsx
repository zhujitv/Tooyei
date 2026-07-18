"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export function TranslationItemActions({
  jobId,
  itemId,
  productSlug,
  canRevalidate,
  canRetry,
}: {
  jobId: string;
  itemId: string;
  productSlug: string;
  canRevalidate: boolean;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const revalidate = async () => {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetchWithRetry(`/admin/api/translation-jobs/${jobId}/items/${itemId}`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVALIDATE" }),
      });
      const body = await response.json().catch(() => null) as { ok?: boolean; error?: string; result?: { status?: string } } | null;
      if (!response.ok || !body?.ok) throw new Error(body?.error || "重新质检失败。");
      setMessage(body.result?.status === "QA_PASSED" ? "质检通过" : body.result?.status === "QA_WARNING" ? "质检完成，有提示" : "质检未通过");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重新质检失败。");
    } finally {
      setPending(false);
    }
  };

  const retry = async () => {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetchWithRetry(`/admin/api/translation-jobs/${jobId}/items/${itemId}`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REQUEUE" }),
      });
      const body = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) throw new Error(body?.error || "重新翻译排队失败。");
      setMessage("已重新排队，请继续执行任务。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重新翻译排队失败。");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex justify-end gap-1">
        {canRetry ? (
          <Button type="button" size="sm" variant="ghost" onClick={retry} disabled={pending} className="text-[#475467] hover:bg-[#EAECF0]">
            {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}重新翻译
          </Button>
        ) : null}
        {canRevalidate ? (
          <Button type="button" size="sm" variant="ghost" onClick={revalidate} disabled={pending} className="text-[#475467] hover:bg-[#EAECF0]">
            {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}重新质检
          </Button>
        ) : null}
        <Button asChild size="sm" variant="ghost" className="text-[#475467] hover:bg-[#EAECF0]"><Link href={`/admin/products/${productSlug}?tab=languages`}><span>人工审核</span><ArrowUpRight className="size-3.5" /></Link></Button>
      </div>
      {message ? <span className="max-w-48 text-right text-[11px] text-[#667085]">{message}</span> : null}
    </div>
  );
}

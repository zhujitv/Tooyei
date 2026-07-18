"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createErrorId } from "@/lib/error-id";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [errorId] = useState(() => error.digest?.trim() || createErrorId());
  useEffect(() => {
    console.error(JSON.stringify({
      level: "error",
      operation: "client.route-boundary",
      errorId,
      message: error.message,
      digest: error.digest,
    }));
  }, [error, errorId]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#F8FAFC] px-5 text-center text-[#111827]">
      <div className="max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#2563EB]">页面暂时不可用</p>
        <h1 className="mt-3 text-2xl font-semibold">我们未能加载此页面</h1>
        <p className="mt-3 text-base leading-7 text-[#475569]">系统已记录详细错误，请稍后重试。错误编号：{errorId}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => unstable_retry()}>重新加载</Button>
          <Button asChild variant="outline"><Link href="/">返回首页</Link></Button>
        </div>
      </div>
    </main>
  );
}

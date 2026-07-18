"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", operation: "client.admin-boundary", message: error.message, digest: error.digest }));
  }, [error]);

  return (
    <section className="rounded-xl border border-red-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-[#111827]">后台内容加载失败</h1>
      <p className="mt-2 text-sm leading-6 text-[#475569]">错误已写入 Vercel Logs。编号：{error.digest || "未生成"}</p>
      <Button className="mt-5" onClick={() => unstable_retry()}>重试</Button>
    </section>
  );
}

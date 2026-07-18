"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", operation: "client.global-boundary", message: error.message, digest: error.digest }));
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: "Inter, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif", background: "#F8FAFC", color: "#111827" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1>系统暂时无法加载</h1>
            <p style={{ color: "#475569", lineHeight: 1.7 }}>错误已记录，请重新加载。编号：{error.digest || "未生成"}</p>
            <button type="button" onClick={() => unstable_retry()} style={{ marginTop: 16, minHeight: 40, padding: "0 20px", border: 0, borderRadius: 8, background: "#2563EB", color: "white", cursor: "pointer" }}>重新加载</button>
          </div>
        </main>
      </body>
    </html>
  );
}

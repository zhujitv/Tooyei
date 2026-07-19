"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, FolderOpen, Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  databaseHealthMessageZh,
  type DatabaseHealthResult,
  type DatabaseHealthStatus,
} from "@/lib/database-health-status";
import { cn } from "@/lib/utils";

const healthTitle: Record<DatabaseHealthStatus, string> = {
  connected: "数据库连接正常",
  not_configured: "DATABASE_URL 未配置",
  connection_failed: "数据库连接失败",
  schema_missing: "文章数据表缺失",
  client_not_generated: "Prisma Client 未生成",
  connection_timeout: "数据库连接超时",
};

const unavailableResult = (): DatabaseHealthResult => ({
  connected: false,
  status: "connection_failed",
  message: "Database health check failed",
  checkedAt: new Date().toISOString(),
});

const databaseHealthEvent = "tooyei:database-health";

async function loadDatabaseHealth() {
  try {
    const response = await fetch("/admin/api/database/health", { cache: "no-store" });
    const result = await response.json() as Partial<DatabaseHealthResult>;
    if (
      typeof result.connected !== "boolean"
      || typeof result.status !== "string"
      || typeof result.message !== "string"
      || typeof result.checkedAt !== "string"
    ) return unavailableResult();
    return result as DatabaseHealthResult;
  } catch {
    return unavailableResult();
  }
}

function useDatabaseHealth(initialHealth: DatabaseHealthResult, broadcastInitial = false) {
  const [refreshedHealth, setRefreshedHealth] = useState<DatabaseHealthResult | null>(null);
  const [pending, startTransition] = useTransition();
  const health = refreshedHealth ?? initialHealth;
  const refresh = useCallback(() => {
    startTransition(async () => {
      const nextHealth = await loadDatabaseHealth();
      setRefreshedHealth(nextHealth);
      window.dispatchEvent(new CustomEvent(databaseHealthEvent, { detail: nextHealth }));
    });
  }, []);

  useEffect(() => {
    const synchronize = (event: Event) => setRefreshedHealth((event as CustomEvent<DatabaseHealthResult>).detail);
    window.addEventListener(databaseHealthEvent, synchronize);
    return () => window.removeEventListener(databaseHealthEvent, synchronize);
  }, []);

  useEffect(() => {
    if (broadcastInitial) {
      window.dispatchEvent(new CustomEvent(databaseHealthEvent, { detail: initialHealth }));
    }
  }, [broadcastInitial, initialHealth]);

  return { health, pending, refresh };
}

export function AdminDatabaseIndicator({ initialHealth }: { initialHealth: DatabaseHealthResult }) {
  const { health, pending } = useDatabaseHealth(initialHealth);
  const connected = health.connected;
  return (
    <span
      className={cn(
        "hidden items-center gap-2 text-[11px] sm:flex",
        connected ? "text-emerald-700" : "text-amber-700",
      )}
      title={databaseHealthMessageZh(health.status)}
    >
      <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500", pending && "animate-pulse")} />
      {connected ? "数据库正常" : "数据库异常"}
    </span>
  );
}

export function AdminArticleHeader({ initialHealth }: { initialHealth: DatabaseHealthResult }) {
  const { health, pending, refresh } = useDatabaseHealth(initialHealth, true);
  const current = health;
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#667085]">内容管理 / 国际 SEO</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">文章与 SEO 增长中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">以英文为内容源，统一管理九语言文章、AI 翻译、发布状态、结构化数据与搜索收录。</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/article-categories"><FolderOpen className="size-4" />栏目管理</Link></Button>
          {current.connected ? (
            <Button asChild className="bg-[#172033] text-white hover:bg-[#27334a]"><Link href="/admin/articles/new"><Plus className="size-4" />新建文章</Link></Button>
          ) : (
            <Button type="button" disabled title="数据库恢复后即可新建文章"><Plus className="size-4" />新建文章</Button>
          )}
        </div>
      </header>

      {!current.connected ? (
        <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-950">
          <TriangleAlert className="size-4" />
          <AlertTitle>{healthTitle[current.status]}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{databaseHealthMessageZh(current.status)} 文章列表仍可打开，但新建和发布操作已停用。</span>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={refresh} className="w-fit border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
              <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
              {pending ? "检测中" : "重新检测"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-xs text-emerald-700">
          <Database className="size-3.5" />PostgreSQL 与文章数据表连接正常
        </p>
      )}
    </>
  );
}

export function AdminDatabaseUnavailable({ initialHealth }: { initialHealth: DatabaseHealthResult }) {
  const router = useRouter();
  const { health, pending, refresh } = useDatabaseHealth(initialHealth, true);
  const current = health;

  useEffect(() => {
    if (current.connected) router.refresh();
  }, [current.connected, router]);

  return (
    <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-950">
      <TriangleAlert className="size-4" />
      <AlertTitle>{healthTitle[current.status]}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
        <span>{databaseHealthMessageZh(current.status)} 为避免误写入，文章编辑与发布操作已停用。</span>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={refresh} className="w-fit border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
          <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
          {pending ? "检测中" : "重新检测"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

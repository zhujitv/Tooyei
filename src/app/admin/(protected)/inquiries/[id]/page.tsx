import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, Mail, MessageSquare, Phone, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { isDatabaseConfigured } from "@/lib/db";
import { getEntityAuditLogs } from "@/lib/repositories/audit-logs";
import { getAdminInquiry, getAssignableAdminUsers } from "@/lib/repositories/inquiries";
import { updateInquiryFollowUpAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "询盘详情",
  robots: { index: false, follow: false },
};

const statuses = ["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"] as const;
const statusLabel: Record<(typeof statuses)[number], string> = {
  NEW: "新询盘",
  QUALIFIED: "已确认",
  IN_PROGRESS: "跟进中",
  WON: "已成交",
  LOST: "已丢单",
  SPAM: "垃圾询盘",
};

const statusColor: Record<string, string> = {
  NEW: "bg-sky-500/12 text-sky-300",
  QUALIFIED: "bg-violet-500/12 text-violet-300",
  IN_PROGRESS: "bg-amber-500/12 text-amber-300",
  WON: "bg-emerald-500/12 text-emerald-300",
  LOST: "bg-rose-500/12 text-rose-300",
  SPAM: "bg-white/8 text-white/35",
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);

const actionLabel = (action: string) => {
  const labels: Record<string, string> = {
    "inquiry.created": "询盘已创建",
    "inquiry.rate_limited": "触发限流",
    "inquiry.follow_up_updated": "跟进信息已更新",
  };
  return labels[action] || action.replace(/^inquiry\./, "").replaceAll("_", " ");
};

const metadataPreview = (metadata: unknown) => {
  if (!metadata || metadata === null) return null;
  const value = JSON.stringify(metadata);
  return value.length > 220 ? `${value.slice(0, 220)}…` : value;
};

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const inquiry = await getAdminInquiry(id);
  if (!inquiry) notFound();

  const databaseReady = isDatabaseConfigured();
  const assignees = await getAssignableAdminUsers();
  const auditLogs = await getEntityAuditLogs("Inquiry", inquiry.id);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
      <Button asChild variant="ghost" className="-ml-3 text-white/60 hover:bg-white/10 hover:text-white">
        <Link href="/admin/inquiries">
          <ArrowLeft />
          询盘
        </Link>
      </Button>

      <div className="mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">询盘详情</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{inquiry.name}</h1>
          <p className="mt-3 text-sm text-white/45">提交时间：{formatDate(inquiry.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={statusColor[inquiry.status]}>{statusLabel[inquiry.status]}</Badge>
          <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
            <Database className="size-3.5" />
            {databaseReady ? "可保存" : "只读"}
          </Badge>
        </div>
      </div>

      {feedback.saved && (
        <Alert className="mt-7 border-emerald-500/30 bg-emerald-500/8 text-emerald-100">
          <Save className="size-4" />
          <AlertTitle>询盘状态已保存</AlertTitle>
          <AlertDescription className="text-emerald-100/65">
            后台列表和总览统计已刷新。
          </AlertDescription>
        </Alert>
      )}
      {feedback.error && (
        <Alert className="mt-7 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>状态未保存</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            {feedback.error === "database" ? "请先连接 PostgreSQL，再更新询盘状态。" : "请选择有效状态。"}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
          <CardHeader>
            <CardTitle>联系方式</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-white/40">邮箱</p>
              <a href={`mailto:${inquiry.email}`} className="mt-1 inline-flex items-center gap-2 text-white hover:text-[#d56a5d]">
                <Mail className="size-4" />
                {inquiry.email}
              </a>
            </div>
            <div>
              <p className="text-sm text-white/40">电话 / WhatsApp</p>
              <p className="mt-1 inline-flex items-center gap-2 text-white/70">
                <Phone className="size-4" />
                {inquiry.phone || "—"}
              </p>
            </div>
            <Separator className="bg-white/10" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-white/40">公司</p>
                <p className="mt-1 text-white/70">{inquiry.company || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">国家 / 地区</p>
                <p className="mt-1 text-white/70">{inquiry.country || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">语言</p>
                <p className="mt-1 text-white/70">{inquiry.locale}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">负责人</p>
                <p className="mt-1 text-white/70">{inquiry.assignedTo?.name || "未分配"}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">更新时间</p>
                <p className="mt-1 text-white/70">{formatDate(inquiry.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-[#d56a5d]" />
              跟进信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateInquiryFollowUpAction} className="space-y-5">
              <input type="hidden" name="id" value={inquiry.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">线索状态</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={inquiry.status}
                    disabled={!databaseReady}
                    className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedToId">负责人</Label>
                  <select
                    id="assignedToId"
                    name="assignedToId"
                    defaultValue={inquiry.assignedTo?.id || ""}
                    disabled={!databaseReady || assignees.length === 0}
                    className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
                  >
                    <option value="">未分配</option>
                    {assignees.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]">
                <Save />
                保存跟进
              </Button>
              {databaseReady && assignees.length === 0 && (
                <p className="text-sm text-white/40">当前没有可分配的启用后台用户。</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <CardTitle>项目需求</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-white/40">关注产品</p>
            <p className="mt-2 text-white/75">
              {inquiry.productLabels.length > 0 ? inquiry.productLabels.join(", ") : "通用询盘"}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/40">留言内容</p>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-white/75">{inquiry.message}</p>
          </div>
          <div>
            <p className="text-sm text-white/40">来源路径</p>
            <p className="mt-2 break-all font-mono text-sm text-white/50">{inquiry.sourcePath || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <CardTitle>活动记录</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-white/40">这条询盘还没有审计记录。</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-medium">{actionLabel(log.action)}</p>
                      <p className="mt-1 text-sm text-white/40">
                        {log.actor ? `${log.actor.name} · ${log.actor.email}` : "系统"}
                      </p>
                    </div>
                    <p className="text-sm text-white/40">{formatDate(log.createdAt)}</p>
                  </div>
                  {metadataPreview(log.metadata) && (
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-black/25 p-3 text-xs leading-5 text-white/45">
                      {metadataPreview(log.metadata)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, Filter, Inbox, MessageSquare, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InquiryStatus } from "@/generated/prisma/client";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminInquiries, getAssignableAdminUsers } from "@/lib/repositories/inquiries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "询盘管理",
  robots: { index: false, follow: false },
};

const statusColor: Record<string, string> = {
  NEW: "bg-sky-500/12 text-sky-300",
  QUALIFIED: "bg-violet-500/12 text-violet-300",
  IN_PROGRESS: "bg-amber-500/12 text-amber-300",
  WON: "bg-emerald-500/12 text-emerald-300",
  LOST: "bg-rose-500/12 text-rose-300",
  SPAM: "bg-white/10 text-white/35",
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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; status?: string; assignedToId?: string }>;
}) {
  const feedback = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const status = statuses.includes(feedback.status as (typeof statuses)[number])
    ? InquiryStatus[feedback.status as (typeof statuses)[number]]
    : undefined;
  const assignedToId = feedback.assignedToId === "unassigned" ? undefined : feedback.assignedToId || undefined;
  const assignees = await getAssignableAdminUsers();
  const inquiries = await getAdminInquiries({
    q: feedback.q,
    status,
    assignedToId,
    unassigned: feedback.assignedToId === "unassigned",
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#d6b36a]">销售线索</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">询盘管理</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            公开联系表单会保存到这里，方便按产品意向、负责人和跟进状态管理。
          </p>
        </div>
        <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
          <Database className="size-3.5" />
          {databaseReady ? "PostgreSQL 已连接" : "需要数据库"}
        </Badge>
      </div>

      {!databaseReady && (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>未连接 PostgreSQL 时无法保存询盘</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            请先在 Vercel 和 Railway 配置 DATABASE_URL，再正式使用公开询盘表单。
          </AlertDescription>
        </Alert>
      )}

      {feedback.error && (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <MessageSquare className="size-4" />
          <AlertTitle>询盘操作失败</AlertTitle>
          <AlertDescription className="text-amber-100/65">请检查所选询盘和状态是否有效。</AlertDescription>
        </Alert>
      )}

      <Card className="mt-8 admin-card rounded-3xl">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="size-5 text-[#d6b36a]" />
                最新询盘
              </CardTitle>
              <p className="mt-2 text-sm text-white/40">共 {inquiries.length} 条匹配记录，按最新提交排序。</p>
            </div>
            <Button asChild variant="ghost" className="w-fit text-white/60 hover:bg-white/10 hover:text-white">
              <Link href="/admin/inquiries">清空筛选</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action="/admin/inquiries" className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="q">搜索</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={feedback.q || ""}
                  placeholder="姓名、邮箱、公司、留言、产品"
                  className="admin-field pl-9 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <select
                id="status"
                name="status"
                defaultValue={feedback.status || ""}
                className="h-9 w-full rounded-lg admin-field px-3 text-sm text-white"
              >
                <option value="">全部状态</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {statusLabel[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">负责人</Label>
              <select
                id="assignedToId"
                name="assignedToId"
                defaultValue={feedback.assignedToId || ""}
                className="h-9 w-full rounded-lg admin-field px-3 text-sm text-white"
              >
                <option value="">全部负责人</option>
                <option value="unassigned">未分配</option>
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.role}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
              <Filter />
              筛选
            </Button>
          </form>

          {inquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
              <Inbox className="mx-auto size-8 text-white/25" />
              <p className="mt-4 font-medium">没有匹配的询盘</p>
              <p className="mt-2 text-sm text-white/40">
                请调整搜索关键词、状态或负责人筛选条件。
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/45">提交时间</TableHead>
                  <TableHead className="text-white/45">联系人</TableHead>
                  <TableHead className="text-white/45">公司 / 国家</TableHead>
                  <TableHead className="text-white/45">关注产品</TableHead>
                  <TableHead className="text-white/45">负责人</TableHead>
                  <TableHead className="text-white/45">状态</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id} className="border-white/10 hover:bg-white/[0.03]">
                    <TableCell className="whitespace-nowrap text-sm text-white/55">{formatDate(inquiry.createdAt)}</TableCell>
                    <TableCell>
                      <p className="font-medium">{inquiry.name}</p>
                      <p className="mt-1 text-sm text-white/45">{inquiry.email}</p>
                    </TableCell>
                    <TableCell className="text-sm text-white/60">
                      <p>{inquiry.company || "—"}</p>
                      <p className="mt-1 text-white/35">{inquiry.country || "—"}</p>
                    </TableCell>
                    <TableCell className="max-w-64 text-sm text-white/60">
                      {inquiry.productLabels.length > 0 ? inquiry.productLabels.join(", ") : "通用询盘"}
                    </TableCell>
                    <TableCell className="text-sm text-white/60">
                      {inquiry.assignedTo ? (
                        <>
                          <p>{inquiry.assignedTo.name}</p>
                          <p className="mt-1 text-white/35">{inquiry.assignedTo.email}</p>
                        </>
                      ) : (
                        <span className="text-white/35">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[inquiry.status]}>{statusLabel[inquiry.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white">
                        <Link href={`/admin/inquiries/${inquiry.id}`}>
                          查看
                          <ArrowRight />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

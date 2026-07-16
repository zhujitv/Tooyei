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
  title: "Inquiries administration",
  robots: { index: false, follow: false },
};

const statusColor: Record<string, string> = {
  NEW: "bg-sky-500/12 text-sky-300",
  QUALIFIED: "bg-violet-500/12 text-violet-300",
  IN_PROGRESS: "bg-amber-500/12 text-amber-300",
  WON: "bg-emerald-500/12 text-emerald-300",
  LOST: "bg-rose-500/12 text-rose-300",
  SPAM: "bg-white/8 text-white/35",
};

const statuses = ["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"] as const;

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
          <p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">SALES PIPELINE</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Inquiries</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Public contact forms are saved here with product interest and follow-up status.
          </p>
        </div>
        <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
          <Database className="size-3.5" />
          {databaseReady ? "PostgreSQL connected" : "Database required"}
        </Badge>
      </div>

      {!databaseReady && (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>Inquiries cannot be saved without PostgreSQL</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            Configure DATABASE_URL on Vercel and Railway before relying on the public form.
          </AlertDescription>
        </Alert>
      )}

      {feedback.error && (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <MessageSquare className="size-4" />
          <AlertTitle>Inquiry action failed</AlertTitle>
          <AlertDescription className="text-amber-100/65">Review the selected inquiry and status.</AlertDescription>
        </Alert>
      )}

      <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="size-5 text-[#d56a5d]" />
                Latest inquiries
              </CardTitle>
              <p className="mt-2 text-sm text-white/40">{inquiries.length} matching records, newest first.</p>
            </div>
            <Button asChild variant="ghost" className="w-fit text-white/60 hover:bg-white/10 hover:text-white">
              <Link href="/admin/inquiries">Clear filters</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action="/admin/inquiries" className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-black/15 p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={feedback.q || ""}
                  placeholder="Name, email, company, message, product"
                  className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={feedback.status || ""}
                className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white"
              >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Owner</Label>
              <select
                id="assignedToId"
                name="assignedToId"
                defaultValue={feedback.assignedToId || ""}
                className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white"
              >
                <option value="">All owners</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.role}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-[#a63429] hover:bg-[#8d2b23]">
              <Filter />
              Filter
            </Button>
          </form>

          {inquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
              <Inbox className="mx-auto size-8 text-white/25" />
              <p className="mt-4 font-medium">No matching inquiries</p>
              <p className="mt-2 text-sm text-white/40">
                Change the search, status or owner filter to expand the result set.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/45">Created</TableHead>
                  <TableHead className="text-white/45">Contact</TableHead>
                  <TableHead className="text-white/45">Company / country</TableHead>
                  <TableHead className="text-white/45">Products</TableHead>
                  <TableHead className="text-white/45">Owner</TableHead>
                  <TableHead className="text-white/45">Status</TableHead>
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
                      {inquiry.productLabels.length > 0 ? inquiry.productLabels.join(", ") : "General request"}
                    </TableCell>
                    <TableCell className="text-sm text-white/60">
                      {inquiry.assignedTo ? (
                        <>
                          <p>{inquiry.assignedTo.name}</p>
                          <p className="mt-1 text-white/35">{inquiry.assignedTo.email}</p>
                        </>
                      ) : (
                        <span className="text-white/35">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[inquiry.status]}>{inquiry.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white">
                        <Link href={`/admin/inquiries/${inquiry.id}`}>
                          Open
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

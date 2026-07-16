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
import { getAdminInquiry } from "@/lib/repositories/inquiries";
import { updateInquiryStatusAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inquiry detail",
  robots: { index: false, follow: false },
};

const statuses = ["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"] as const;

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

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
      <Button asChild variant="ghost" className="-ml-3 text-white/60 hover:bg-white/10 hover:text-white">
        <Link href="/admin/inquiries">
          <ArrowLeft />
          Inquiries
        </Link>
      </Button>

      <div className="mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">INQUIRY DETAIL</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{inquiry.name}</h1>
          <p className="mt-3 text-sm text-white/45">Created {formatDate(inquiry.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={statusColor[inquiry.status]}>{inquiry.status.replaceAll("_", " ")}</Badge>
          <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
            <Database className="size-3.5" />
            {databaseReady ? "Saving enabled" : "Read-only"}
          </Badge>
        </div>
      </div>

      {feedback.saved && (
        <Alert className="mt-7 border-emerald-500/30 bg-emerald-500/8 text-emerald-100">
          <Save className="size-4" />
          <AlertTitle>Inquiry status saved</AlertTitle>
          <AlertDescription className="text-emerald-100/65">
            The admin list and dashboard counters were refreshed.
          </AlertDescription>
        </Alert>
      )}
      {feedback.error && (
        <Alert className="mt-7 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>Status was not saved</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            {feedback.error === "database" ? "Connect PostgreSQL before updating inquiry status." : "Select a valid status."}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-white/40">Email</p>
              <a href={`mailto:${inquiry.email}`} className="mt-1 inline-flex items-center gap-2 text-white hover:text-[#d56a5d]">
                <Mail className="size-4" />
                {inquiry.email}
              </a>
            </div>
            <div>
              <p className="text-sm text-white/40">Phone / WhatsApp</p>
              <p className="mt-1 inline-flex items-center gap-2 text-white/70">
                <Phone className="size-4" />
                {inquiry.phone || "—"}
              </p>
            </div>
            <Separator className="bg-white/10" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-white/40">Company</p>
                <p className="mt-1 text-white/70">{inquiry.company || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Country / region</p>
                <p className="mt-1 text-white/70">{inquiry.country || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Locale</p>
                <p className="mt-1 text-white/70">{inquiry.locale}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Updated</p>
                <p className="mt-1 text-white/70">{formatDate(inquiry.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-[#d56a5d]" />
              Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateInquiryStatusAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <input type="hidden" name="id" value={inquiry.id} />
              <div className="space-y-2">
                <Label htmlFor="status">Pipeline status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={inquiry.status}
                  disabled={!databaseReady}
                  className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]">
                <Save />
                Save status
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <CardTitle>Project requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-white/40">Interested products</p>
            <p className="mt-2 text-white/75">
              {inquiry.productLabels.length > 0 ? inquiry.productLabels.join(", ") : "General request"}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/40">Message</p>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-white/75">{inquiry.message}</p>
          </div>
          <div>
            <p className="text-sm text-white/40">Source path</p>
            <p className="mt-2 break-all font-mono text-sm text-white/50">{inquiry.sourcePath || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

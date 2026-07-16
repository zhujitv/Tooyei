import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, Inbox, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminInquiries } from "@/lib/repositories/inquiries";

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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const feedback = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const inquiries = await getAdminInquiries();

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
          <CardTitle className="flex items-center gap-2">
            <Inbox className="size-5 text-[#d56a5d]" />
            Latest inquiries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
              <Inbox className="mx-auto size-8 text-white/25" />
              <p className="mt-4 font-medium">No inquiries yet</p>
              <p className="mt-2 text-sm text-white/40">
                Submit the public contact form to create the first trackable lead.
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

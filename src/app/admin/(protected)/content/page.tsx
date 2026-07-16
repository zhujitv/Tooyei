import type { Metadata } from "next";
import { BookOpen, CircleHelp, Database, Languages, MessageSquare, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContentOperationsSummary } from "@/lib/repositories/content-operations";
import { languageNames } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content operations preview",
  robots: { index: false, follow: false },
};

export default async function ContentOperationsPage() {
  const summary = await getContentOperationsSummary();
  const metrics = [
    { label: "Products", value: summary.products, icon: Package },
    { label: "Articles", value: summary.articles, icon: BookOpen },
    { label: "FAQs", value: summary.faqs, icon: CircleHelp },
    { label: "New inquiries", value: summary.newInquiries, icon: MessageSquare },
  ];

  return (
    <main className="px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-sm bg-[#a63429] text-sm font-black">TY</span>
              <Badge variant="outline" className="border-white/15 text-white/65">PROTECTED ADMIN</Badge>
            </div>
            <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Content operations</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
              A read-only view of catalogue volume, translation readiness and incoming demand.
            </p>
          </div>
          <Badge className={summary.source === "database" ? "bg-emerald-600" : "bg-amber-600"}>
            <Database className="size-3.5" /> {summary.source === "database" ? "PostgreSQL connected" : "Sample repository"}
          </Badge>
        </div>

        {summary.source === "sample" && (
          <Alert className="mt-10 border-amber-500/30 bg-amber-500/8 text-amber-100">
            <Database className="size-4" />
            <AlertTitle>Database connection is not configured</AlertTitle>
            <AlertDescription className="text-amber-100/65">
              The public site and this dashboard are using the five migration samples. Add DATABASE_URL, deploy the schema and run the seed command to switch to PostgreSQL.
            </AlertDescription>
          </Alert>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/55">{label}</CardTitle>
                <Icon className="size-4 text-[#d56a5d]" />
              </CardHeader>
              <CardContent><p className="font-mono text-4xl font-semibold">{value}</p></CardContent>
            </Card>
          ))}
        </section>

        <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Languages className="size-5 text-[#d56a5d]" />
              <div>
                <CardTitle>Translation workflow</CardTitle>
                <p className="mt-1 text-sm text-white/45">Only published translations become indexable pages and hreflang alternatives.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/45">Language</TableHead>
                  <TableHead className="text-white/45">Published</TableHead>
                  <TableHead className="text-white/45">Needs review</TableHead>
                  <TableHead className="text-white/45">Machine draft</TableHead>
                  <TableHead className="text-white/45">Missing</TableHead>
                  <TableHead className="min-w-48 text-white/45">Readiness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.translations.map((translation) => {
                  const total = translation.published + translation.review + translation.machineDraft + translation.missing;
                  const readiness = total ? Math.round((translation.published / total) * 100) : 0;
                  return (
                    <TableRow key={translation.locale} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="font-medium">{languageNames[translation.locale]}</TableCell>
                      <TableCell className="font-mono text-emerald-400">{translation.published}</TableCell>
                      <TableCell className="font-mono text-amber-300">{translation.review}</TableCell>
                      <TableCell className="font-mono text-sky-300">{translation.machineDraft}</TableCell>
                      <TableCell className="font-mono text-white/40">{translation.missing}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress value={readiness} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#a63429]" />
                          <span className="w-10 text-right font-mono text-xs text-white/55">{readiness}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

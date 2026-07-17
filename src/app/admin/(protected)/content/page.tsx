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
export const metadata: Metadata = { title: "内容运营总览", robots: { index: false, follow: false } };

export default async function ContentOperationsPage() {
  const summary = await getContentOperationsSummary();
  const metrics = [
    { label: "产品", value: summary.products, icon: Package, detail: "产品目录" },
    { label: "文章", value: summary.articles, icon: BookOpen, detail: "内容资产" },
    { label: "常见问题", value: summary.faqs, icon: CircleHelp, detail: "客户支持" },
    { label: "新询盘", value: summary.newInquiries, icon: MessageSquare, detail: "待跟进线索" },
  ];

  return (
    <main className="admin-page">
      <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium text-zinc-600">工作空间 / 总览</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-zinc-50">运营工作台</h1>
          <p className="mt-1.5 text-sm text-zinc-500">产品、内容、多语言发布与销售线索的统一视图。</p>
        </div>
        <Badge className={summary.source === "database" ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/20 bg-amber-500/10 text-amber-300"}>
          <Database className="size-3" /> {summary.source === "database" ? "PostgreSQL 已连接" : "示例数据"}
        </Badge>
      </header>

      {summary.source === "sample" ? (
        <Alert className="mt-5 border-amber-500/20 bg-amber-500/[0.07] text-amber-200">
          <Database className="size-4" />
          <AlertTitle>数据库连接未配置</AlertTitle>
          <AlertDescription className="text-amber-200/60">当前公开站和后台正在使用迁移示例数据。配置 DATABASE_URL 后将自动切换为 PostgreSQL 数据。</AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, detail }) => (
          <div key={label} className="bg-[#111113] p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] text-zinc-600">{label}</span><Icon className="size-3.5 text-zinc-700" /></div>
            <p className="mt-3 font-mono text-2xl font-medium tracking-[-0.04em] text-zinc-100">{value}</p>
            <p className="mt-1 text-[10px] text-zinc-700">{detail}</p>
          </div>
        ))}
      </section>

      <Card className="admin-card mt-5">
        <CardHeader className="border-b border-white/[0.065] pb-4">
          <div className="flex items-start gap-3">
            <span className="grid size-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-500"><Languages className="size-4" /></span>
            <div><CardTitle className="text-sm">多语言发布进度</CardTitle><p className="mt-1 text-xs text-zinc-600">只有已发布的翻译会生成可索引页面和 hreflang 入口。</p></div>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <Table>
            <TableHeader><TableRow className="border-white/[0.07] hover:bg-transparent"><TableHead className="text-zinc-600">语言</TableHead><TableHead className="text-zinc-600">已发布</TableHead><TableHead className="text-zinc-600">待审核</TableHead><TableHead className="text-zinc-600">机器草稿</TableHead><TableHead className="text-zinc-600">缺失</TableHead><TableHead className="min-w-48 text-zinc-600">完成度</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.translations.map((translation) => {
                const total = translation.published + translation.review + translation.machineDraft + translation.missing;
                const readiness = total ? Math.round((translation.published / total) * 100) : 0;
                return (
                  <TableRow key={translation.locale} className="border-white/[0.065] hover:bg-white/[0.025]">
                    <TableCell className="font-medium text-zinc-300">{languageNames[translation.locale]}</TableCell>
                    <TableCell className="font-mono text-emerald-400">{translation.published}</TableCell>
                    <TableCell className="font-mono text-amber-300">{translation.review}</TableCell>
                    <TableCell className="font-mono text-violet-300">{translation.machineDraft}</TableCell>
                    <TableCell className="font-mono text-zinc-600">{translation.missing}</TableCell>
                    <TableCell><div className="flex items-center gap-3"><Progress value={readiness} className="h-1 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-zinc-300" /><span className="w-10 text-right font-mono text-[10px] text-zinc-500">{readiness}%</span></div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

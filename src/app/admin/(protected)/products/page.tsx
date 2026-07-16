import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, Filter, Languages, Package, Search, Star } from "lucide-react";
import { ContentStatus, ProductKind } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminProducts, getAdminProductStats } from "@/lib/repositories/admin-products";
import { locales } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "产品管理", robots: { index: false, follow: false } };

const statusColor: Record<string, string> = {
  DRAFT: "bg-white/8 text-white/45",
  ARCHIVED: "bg-rose-500/12 text-rose-300",
  PUBLISHED: "bg-emerald-500/12 text-emerald-300",
  NEEDS_REVIEW: "bg-amber-500/12 text-amber-300",
  MACHINE_DRAFT: "bg-sky-500/12 text-sky-300",
  MISSING: "bg-white/8 text-white/35",
};

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  ARCHIVED: "已归档",
  PUBLISHED: "已发布",
  NEEDS_REVIEW: "待审核",
  MACHINE_DRAFT: "机器草稿",
  MISSING: "缺失",
};

const productKinds = Object.values(ProductKind);
const productStatuses = Object.values(ContentStatus);

const kindLabel: Record<ProductKind, string> = {
  SPC: "SPC 石塑地板",
  ESPC: "ESPC 地板",
  VSPC: "VSPC 地板",
  LSPC: "LSPC 地板",
  WPC: "WPC 地板",
  LVT: "LVT 地板",
  LAMINATE: "强化地板",
  WALL_PANEL: "墙板",
  ACCESSORY: "配件",
};

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Shanghai",
      }).format(date)
    : "—";

const parseStatus = (value?: string) =>
  productStatuses.includes(value as ContentStatus) ? (value as ContentStatus) : undefined;

const parseKind = (value?: string) =>
  productKinds.includes(value as ProductKind) ? (value as ProductKind) : undefined;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kind?: string }>;
}) {
  const filters = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const status = parseStatus(filters.status);
  const kind = parseKind(filters.kind);
  const [products, stats] = await Promise.all([
    getAdminProducts({ q: filters.q, status, kind }),
    getAdminProductStats(),
  ]);
  const metricCards = [
    { label: "全部产品", value: stats.total, tone: "text-white", icon: Package },
    { label: "已发布", value: stats.published, tone: "text-emerald-300", icon: Database },
    { label: "精选产品", value: stats.featured, tone: "text-[#d56a5d]", icon: Star },
    { label: "待处理翻译", value: stats.needsReview + stats.missing, tone: "text-amber-300", icon: Languages },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">产品目录</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">产品管理</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">管理产品基础信息、发布状态、精选排序、分类和多语言 SEO 内容。</p></div>
        <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}><Database className="size-3.5" />{databaseReady ? "可编辑" : "示例只读"}</Badge>
      </div>

      {!databaseReady && <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100"><Database className="size-4"/><AlertTitle>保存需要数据库</AlertTitle><AlertDescription className="text-amber-100/65">当前可以预览完整编辑流程。配置并初始化 PostgreSQL 后，保存功能会自动启用。</AlertDescription></Alert>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, tone, icon: Icon }) => (
          <Card key={label} className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/55">{label}</CardTitle>
              <Icon className="size-4 text-[#d56a5d]" />
            </CardHeader>
            <CardContent>
              <p className={`font-mono text-3xl font-semibold ${tone}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><Languages className="size-5 text-[#d56a5d]"/>产品运营清单</CardTitle>
              <p className="mt-2 text-sm text-white/40">当前筛选结果：{products.length} 个产品。</p>
            </div>
            <Button asChild variant="ghost" className="w-fit text-white/60 hover:bg-white/10 hover:text-white">
              <Link href="/admin/products">清空筛选</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action="/admin/products" className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-black/15 p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="q">搜索产品</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={filters.q || ""}
                  placeholder="产品名、SKU、slug、分类"
                  className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">产品状态</Label>
              <select
                id="status"
                name="status"
                defaultValue={status || ""}
                className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white"
              >
                <option value="">全部状态</option>
                {productStatuses.map((item) => (
                  <option key={item} value={item}>{statusLabel[item]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind">产品类型</Label>
              <select
                id="kind"
                name="kind"
                defaultValue={kind || ""}
                className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white"
              >
                <option value="">全部类型</option>
                {productKinds.map((item) => (
                  <option key={item} value={item}>{kindLabel[item]}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-[#a63429] hover:bg-[#8d2b23]">
              <Filter />
              筛选
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/45">产品</TableHead>
                <TableHead className="text-white/45">状态</TableHead>
                <TableHead className="text-white/45">分类 / 类型</TableHead>
                <TableHead className="text-white/45">精选</TableHead>
                <TableHead className="text-white/45">排序</TableHead>
                {locales.map((locale)=><TableHead key={locale} className="text-white/45">{locale.toUpperCase()}</TableHead>)}
                <TableHead className="text-white/45">更新</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product)=>(
                <TableRow key={product.slug} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell className="max-w-80">
                    <p className="font-medium">{product.title}</p>
                    <p className="mt-1 font-mono text-xs text-white/35">{product.sku} · {product.slug}</p>
                  </TableCell>
                  <TableCell><Badge className={statusColor[product.status]}>{statusLabel[product.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-white/60">
                    <p>{product.category}</p>
                    <p className="mt-1 text-white/35">{kindLabel[product.kind]}</p>
                  </TableCell>
                  <TableCell>{product.featured ? <Badge className="bg-[#a63429] text-white">精选</Badge> : <span className="text-white/30">—</span>}</TableCell>
                  <TableCell className="font-mono text-white/55">{product.sortOrder}</TableCell>
                  {locales.map((locale)=><TableCell key={locale}><Badge className={statusColor[product.translationStates[locale]]}>{statusLabel[product.translationStates[locale]]}</Badge></TableCell>)}
                  <TableCell className="whitespace-nowrap text-sm text-white/45">{formatDate(product.updatedAt)}</TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white"><Link href={`/admin/products/${product.slug}`}>编辑<ArrowRight/></Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 px-6 py-14 text-center text-white/45">
              没有匹配的产品。请调整搜索关键词、状态或类型筛选。
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

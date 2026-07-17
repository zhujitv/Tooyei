import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Database,
  ExternalLink,
  Filter,
  Languages,
  Package,
  Plus,
  Search,
  Settings2,
  Star,
} from "lucide-react";
import { ContentStatus, ProductKind } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getAdminProductCategoryOptions,
  getAdminProducts,
  getAdminProductStats,
} from "@/lib/repositories/admin-products";
import { languageNames, locales } from "@/lib/site";
import { createProductAction, updateProductListSettingsAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "产品管理", robots: { index: false, follow: false } };

const statusColor: Record<string, string> = {
  DRAFT: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  ARCHIVED: "border-rose-400/20 bg-rose-500/12 text-rose-200",
  PUBLISHED: "border-emerald-400/20 bg-emerald-500/12 text-emerald-200",
  NEEDS_REVIEW: "border-amber-400/20 bg-amber-500/12 text-amber-200",
  MACHINE_DRAFT: "border-sky-400/20 bg-sky-500/12 text-sky-200",
  MISSING: "border-white/10 bg-white/[0.08] text-white/40",
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

const feedbackCopy = {
  saved: {
    quick: ["产品快速设置已保存", "发布状态、精选状态或排序已更新，并刷新公开页面缓存。"],
  },
  error: {
    database: ["数据库未连接", "产品新增和保存需要 PostgreSQL 数据库。"],
    create: ["新建失败", "请检查 slug、SKU、分类、中文标题和摘要；slug/SKU 不能重复。"],
    quick: ["快速保存失败", "请检查产品是否存在、状态和排序值是否有效。"],
  },
} as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kind?: string; saved?: string; error?: string }>;
}) {
  const filters = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const status = parseStatus(filters.status);
  const kind = parseKind(filters.kind);
  const [products, stats, categories] = await Promise.all([
    getAdminProducts({ q: filters.q, status, kind }),
    getAdminProductStats(),
    getAdminProductCategoryOptions(),
  ]);
  const defaultCategoryId = categories[0]?.id ?? "";
  const successFeedback = filters.saved ? feedbackCopy.saved[filters.saved as keyof typeof feedbackCopy.saved] : undefined;
  const errorFeedback = filters.error ? feedbackCopy.error[filters.error as keyof typeof feedbackCopy.error] : undefined;
  const metricCards = [
    { label: "全部产品", value: stats.total, tone: "text-white", icon: Package, help: "目录总量" },
    { label: "已发布", value: stats.published, tone: "text-emerald-200", icon: Database, help: "公开可见" },
    { label: "精选产品", value: stats.featured, tone: "text-[#d6b36a]", icon: Star, help: "首页优先" },
    { label: "待处理翻译", value: stats.needsReview + stats.missing, tone: "text-amber-200", icon: Languages, help: "缺失或待审核" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(182,138,76,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.095),rgba(255,255,255,0.035))] shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_420px] lg:p-8">
          <div>
            <Badge variant="outline" className="border-white/15 text-white/65">
              <Boxes className="size-3.5" />
              产品目录管理
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">产品管理控制台</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
              这里负责产品从新建、发布、精选、排序到详情内容维护的完整管理。归档用于下架产品，避免误删历史询盘关联。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
                <Database className="size-3.5" />
                {databaseReady ? "PostgreSQL 可写" : "示例只读"}
              </Badge>
              <Badge variant="outline" className="border-white/15 text-white/55">
                当前结果 {products.length} 项
              </Badge>
            </div>
          </div>

          <Card className="border-white/10 bg-[#050a13]/45 text-white shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-[#d6b36a]" />
                新建产品
              </CardTitle>
              <p className="text-sm text-white/40">先创建基础产品，再进入详情页补图片、规格和多语言。</p>
            </CardHeader>
            <CardContent>
              <form action={createProductAction} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-slug">URL Slug</Label>
                    <Input
                      id="new-slug"
                      name="slug"
                      required
                      minLength={3}
                      maxLength={120}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      placeholder="spc-click-flooring"
                      disabled={!databaseReady}
                      className="admin-field disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-sku">SKU</Label>
                    <Input
                      id="new-sku"
                      name="sku"
                      required
                      maxLength={80}
                      placeholder="TY-NEW-001"
                      disabled={!databaseReady}
                      className="admin-field disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-2">
                    <Label htmlFor="new-category">分类</Label>
                    <select
                      id="new-category"
                      name="categoryId"
                      required
                      defaultValue={defaultCategoryId}
                      disabled={!databaseReady || !categories.length}
                      className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label} · {kindLabel[category.kind]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-status">状态</Label>
                    <select
                      id="new-status"
                      name="status"
                      defaultValue="DRAFT"
                      disabled={!databaseReady}
                      className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                    >
                      {productStatuses.map((item) => (
                        <option key={item} value={item}>
                          {statusLabel[item]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-title">中文标题</Label>
                  <Input
                    id="new-title"
                    name="title"
                    required
                    minLength={3}
                    maxLength={180}
                    placeholder="例如：同步对花 SPC 锁扣地板"
                    disabled={!databaseReady}
                    className="admin-field disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-summary">中文摘要</Label>
                  <Textarea
                    id="new-summary"
                    name="summary"
                    required
                    minLength={20}
                    maxLength={800}
                    placeholder="用于产品列表、详情页和 SEO 描述的基础摘要，至少 20 个字符。"
                    disabled={!databaseReady}
                    className="min-h-20 admin-field disabled:opacity-60"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="new-sort">排序</Label>
                    <Input
                      id="new-sort"
                      name="sortOrder"
                      type="number"
                      min={0}
                      defaultValue={stats.total + 1}
                      disabled={!databaseReady}
                      className="admin-field disabled:opacity-60"
                    />
                  </div>
                  <label className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white/65">
                    <input type="checkbox" name="featured" disabled={!databaseReady} className="size-4 accent-[#b68a4c]" />
                    设为精选
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={!databaseReady || !categories.length}
                  className="h-10 w-full bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]"
                >
                  <Plus />
                  创建并进入编辑
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {successFeedback ? (
        <Alert className="mt-8 border-emerald-500/30 bg-emerald-500/8 text-emerald-100">
          <Settings2 className="size-4" />
          <AlertTitle>{successFeedback[0]}</AlertTitle>
          <AlertDescription className="text-emerald-100/65">{successFeedback[1]}</AlertDescription>
        </Alert>
      ) : null}

      {errorFeedback ? (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>{errorFeedback[0]}</AlertTitle>
          <AlertDescription className="text-amber-100/65">{errorFeedback[1]}</AlertDescription>
        </Alert>
      ) : null}

      {!databaseReady ? (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>当前为只读示例数据</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            配置 DATABASE_URL 并完成数据库初始化后，新建、发布、精选、排序和编辑保存会自动启用。
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, tone, icon: Icon, help }) => (
          <Card key={label} className="admin-card rounded-3xl">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-white/55">{label}</CardTitle>
                <p className="mt-1 text-xs text-white/30">{help}</p>
              </div>
              <Icon className="size-4 text-[#d6b36a]" />
            </CardHeader>
            <CardContent>
              <p className={`font-mono text-3xl font-semibold ${tone}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-8 admin-card rounded-3xl">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="size-5 text-[#d6b36a]" />
                筛选产品
              </CardTitle>
              <p className="mt-2 text-sm text-white/40">按标题、SKU、slug、分类、状态和类型快速定位产品。</p>
            </div>
            <Button asChild variant="ghost" className="w-fit text-white/60 hover:bg-white/10 hover:text-white">
              <Link href="/admin/products">清空筛选</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/products"
            className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="q">搜索产品</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={filters.q || ""}
                  placeholder="产品名、SKU、slug、分类"
                  className="admin-field pl-9 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">产品状态</Label>
              <select
                id="status"
                name="status"
                defaultValue={status || ""}
                className="h-9 w-full rounded-lg admin-field px-3 text-sm text-white"
              >
                <option value="">全部状态</option>
                {productStatuses.map((item) => (
                  <option key={item} value={item}>
                    {statusLabel[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind">产品类型</Label>
              <select
                id="kind"
                name="kind"
                defaultValue={kind || ""}
                className="h-9 w-full rounded-lg admin-field px-3 text-sm text-white"
              >
                <option value="">全部类型</option>
                {productKinds.map((item) => (
                  <option key={item} value={item}>
                    {kindLabel[item]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
              <Filter />
              筛选
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">产品运营清单</h2>
            <p className="mt-2 text-sm text-white/40">当前筛选结果：{products.length} 个产品。</p>
          </div>
        </div>

        {products.map((product) => (
          <Card key={product.slug} className="admin-card rounded-[1.75rem]">
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr_360px]">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusColor[product.status]}>{statusLabel[product.status]}</Badge>
                    {product.featured ? <Badge className="bg-[#b68a4c] text-[#0b1220]">精选</Badge> : null}
                    <Badge variant="outline" className="border-white/15 text-white/55">
                      {kindLabel[product.kind]}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-white">{product.title}</h3>
                  <p className="mt-2 font-mono text-xs text-white/35">
                    {product.sku} · {product.slug}
                  </p>
                  <p className="mt-4 text-sm text-white/45">{product.category}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
                      <Link href={`/admin/products/${product.slug}`}>
                        进入编辑
                        <ArrowRight />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10">
                      <Link href={`/products/${product.slug}`} target="_blank">
                        公开页
                        <ExternalLink />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="border-y border-white/10 p-5 sm:p-6 lg:border-x lg:border-y-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[0.04] p-4">
                      <p className="text-xs text-white/35">已发布翻译</p>
                      <p className="mt-2 font-mono text-2xl text-white">{product.publishedTranslations}/{locales.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] p-4">
                      <p className="text-xs text-white/35">缺失翻译</p>
                      <p className="mt-2 font-mono text-2xl text-amber-200">{product.missingTranslations}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {locales.map((locale) => (
                      <div key={locale} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2">
                        <span className="text-xs text-white/45">{languageNames[locale]}</span>
                        <Badge className={statusColor[product.translationStates[locale]]}>
                          {statusLabel[product.translationStates[locale]]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-white/30">最后更新：{formatDate(product.updatedAt)}</p>
                </div>

                <div className="p-5 sm:p-6">
                  <form action={updateProductListSettingsAction} className="space-y-4">
                    <input type="hidden" name="slug" value={product.slug} />
                    <div className="grid grid-cols-[1fr_110px] gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`${product.slug}-status`}>快速状态</Label>
                        <select
                          id={`${product.slug}-status`}
                          name="status"
                          defaultValue={product.status}
                          disabled={!databaseReady}
                          className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                        >
                          {productStatuses.map((item) => (
                            <option key={item} value={item}>
                              {statusLabel[item]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${product.slug}-sort`}>排序</Label>
                        <Input
                          id={`${product.slug}-sort`}
                          name="sortOrder"
                          type="number"
                          min={0}
                          defaultValue={product.sortOrder}
                          disabled={!databaseReady}
                          className="admin-field disabled:opacity-60"
                        />
                      </div>
                    </div>
                    <label className="inline-flex h-10 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white/65">
                      <input
                        type="checkbox"
                        name="featured"
                        defaultChecked={product.featured}
                        disabled={!databaseReady}
                        className="size-4 accent-[#b68a4c] disabled:opacity-60"
                      />
                      首页精选 / 优先展示
                    </label>
                    <Button
                      type="submit"
                      disabled={!databaseReady}
                      className="h-10 w-full bg-white text-[#0b1220] hover:bg-[#e9dcc4]"
                    >
                      <Settings2 />
                      保存快速设置
                    </Button>
                    <p className="text-xs leading-5 text-white/35">归档即下架，不做物理删除，保留询盘和历史内容关联。</p>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] px-6 py-16 text-center">
            <Package className="mx-auto size-10 text-white/25" />
            <h3 className="mt-4 font-semibold text-white">没有匹配的产品</h3>
            <p className="mt-2 text-sm text-white/40">请调整搜索关键词、状态或类型筛选。</p>
          </div>
        )}
      </section>
    </main>
  );
}

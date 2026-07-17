import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Database,
  Filter,
  FolderCheck,
  FolderX,
  Languages,
  Package,
  Plus,
  Search,
  SearchCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ContentStatus, ProductKind } from "@/generated/prisma/client";
import { AdminProductCatalog } from "@/components/admin-product-catalog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getAdminProductCategoryOptions,
  getAdminProducts,
  getAdminProductStats,
} from "@/lib/repositories/admin-products";
import {
  assignProductCategoryAction,
  batchUpdateProductsAction,
  createProductAction,
  updateProductListSettingsAction,
} from "./actions";
import { contentLocales, languageMarkers, languageNames, type ContentLocale } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "产品管理", robots: { index: false, follow: false } };

const productKinds = Object.values(ProductKind);
const productStatuses = Object.values(ContentStatus);

const statusLabel: Record<ContentStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

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

const parseStatus = (value?: string) =>
  productStatuses.includes(value as ContentStatus) ? (value as ContentStatus) : undefined;

const parseKind = (value?: string) =>
  productKinds.includes(value as ProductKind) ? (value as ProductKind) : undefined;

const feedbackCopy = {
  saved: {
    quick: ["产品设置已保存", "发布状态、精选状态或排序已经更新。"],
    category: ["产品归类已更新", "主栏目和动态栏目关联已经同步。"],
    batch: ["批量操作已完成", "所选产品已更新，公开页面缓存已经刷新。"],
  },
  error: {
    database: ["数据库未连接", "产品新增和保存需要 PostgreSQL 数据库。"],
    create: ["新建失败", "请检查 slug、SKU、分类、中文标题和摘要；slug/SKU 不能重复。"],
    quick: ["保存失败", "请检查产品是否存在、状态和排序值是否有效。"],
    category: ["归类失败", "请选择有效栏目，并确认产品仍然存在。"],
    batch: ["批量操作失败", "请至少选择一个产品，并检查操作类型是否有效。"],
  },
} as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    kind?: string;
    classification?: string;
    locale?: string;
    translationState?: string;
    seoState?: string;
    page?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const filters = await searchParams;
  const databaseReady = isDatabaseConfigured();
  const status = parseStatus(filters.status);
  const kind = parseKind(filters.kind);
  const classification = ["CLASSIFIED", "UNCLASSIFIED"].includes(filters.classification ?? "")
    ? (filters.classification as "CLASSIFIED" | "UNCLASSIFIED")
    : undefined;
  const locale = contentLocales.includes(filters.locale as ContentLocale) ? (filters.locale as ContentLocale) : undefined;
  const translationState = ["MISSING", "NOT_PUBLISHED"].includes(filters.translationState ?? "")
    ? (filters.translationState as "MISSING" | "NOT_PUBLISHED")
    : undefined;
  const seoState = ["READY", "MISSING"].includes(filters.seoState ?? "")
    ? (filters.seoState as "READY" | "MISSING")
    : undefined;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const [productPage, stats, categories] = await Promise.all([
    getAdminProducts({ q: filters.q, status, kind, classification, locale, translationState, seoState, page }),
    getAdminProductStats(),
    getAdminProductCategoryOptions(),
  ]);
  const products = productPage.items;
  const defaultCategoryId = categories[0]?.id ?? "";
  const successFeedback = filters.saved ? feedbackCopy.saved[filters.saved as keyof typeof feedbackCopy.saved] : undefined;
  const errorFeedback = filters.error ? feedbackCopy.error[filters.error as keyof typeof feedbackCopy.error] : undefined;
  const averageCompletion = products.length
    ? Math.round(products.reduce((sum, product) => sum + product.completion, 0) / products.length)
    : 0;
  const catalogProducts = products.map((product) => ({
    ...product,
    updatedAt: product.updatedAt?.toISOString() ?? null,
  }));

  const currentQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "saved" && key !== "error") currentQuery.set(key, value);
  }
  const returnTo = `/admin/products${currentQuery.size ? `?${currentQuery}` : ""}`;
  const filteredHref = (updates: Record<string, string | null>) => {
    const query = new URLSearchParams(currentQuery);
    query.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    return `/admin/products${query.size ? `?${query}` : ""}`;
  };
  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams(currentQuery);
    query.set("page", String(targetPage));
    return `/admin/products?${query}`;
  };

  const metrics = [
    { label: "产品总数", value: stats.total, detail: `${stats.published} 个已发布 · ${stats.draft} 个草稿`, icon: Package, tone: "text-zinc-100" },
    { label: "未归类", value: stats.unclassified, detail: "尚未关联动态栏目", icon: FolderX, tone: stats.unclassified ? "text-rose-300" : "text-emerald-300" },
    { label: "翻译待完善", value: stats.missing, detail: `覆盖 ${contentLocales.length} 个语言版本`, icon: Languages, tone: stats.missing ? "text-amber-300" : "text-emerald-300" },
    { label: "SEO 待完善", value: stats.missingSeo, detail: "缺少本语言 SEO 标题或描述", icon: SearchCheck, tone: stats.missingSeo ? "text-violet-300" : "text-emerald-300" },
    { label: "平均完整度", value: `${averageCompletion}%`, detail: "按当前页产品计算", icon: Sparkles, tone: "text-violet-300" },
  ];

  return (
    <main className="admin-page">
      <header className="flex flex-col gap-5 border-b border-white/[0.07] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-600">
            <span>内容管理</span>
            <span>/</span>
            <span className="text-zinc-400">产品目录</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-zinc-50">产品</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-500">管理产品资料、发布状态、多语言内容、SEO 与公开页面。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-500 sm:flex">
            <span className={databaseReady ? "size-1.5 rounded-full bg-emerald-500" : "size-1.5 rounded-full bg-amber-500"} />
            {databaseReady ? "数据库已连接" : "只读模式"}
          </span>
          <Button asChild size="sm" className="bg-zinc-100 text-zinc-950 hover:bg-white">
            <a href="#new-product">
              <Plus />
              新建产品
            </a>
          </Button>
        </div>
      </header>

      {successFeedback ? (
        <Alert className="mt-5 border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-200">
          <CheckCircle2 className="size-4" />
          <AlertTitle>{successFeedback[0]}</AlertTitle>
          <AlertDescription className="text-emerald-200/60">{successFeedback[1]}</AlertDescription>
        </Alert>
      ) : null}

      {errorFeedback ? (
        <Alert className="mt-5 border-amber-500/20 bg-amber-500/[0.07] text-amber-200">
          <TriangleAlert className="size-4" />
          <AlertTitle>{errorFeedback[0]}</AlertTitle>
          <AlertDescription className="text-amber-200/60">{errorFeedback[1]}</AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="bg-[#111113] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-600">{label}</span>
              <Icon className="size-3.5 text-zinc-700" />
            </div>
            <p className={`mt-3 font-mono text-2xl font-medium tracking-[-0.04em] ${tone}`}>{value}</p>
            <p className="mt-1 text-[10px] text-zinc-700">{detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-3" aria-label="产品运营待办">
        <Link href={filteredHref({ classification: "UNCLASSIFIED", translationState: null, seoState: null })} className="group flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 transition-colors hover:border-[#B8C0CC]">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"><FolderX className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#172033]">处理未归类产品</span><span className="mt-1 block text-xs text-[#667085]">{stats.unclassified ? `${stats.unclassified} 个产品等待归类` : "所有产品均已归类"}</span></span>
          <FolderCheck className="size-4 text-[#98A2B3] transition-colors group-hover:text-[#344054]" />
        </Link>
        <Link href={filteredHref({ classification: null, translationState: "MISSING", seoState: null })} className="group flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 transition-colors hover:border-[#B8C0CC]">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><Languages className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#172033]">补齐语言翻译</span><span className="mt-1 block text-xs text-[#667085]">{stats.missing ? `${stats.missing} 个产品缺少至少一种语言` : "九语言内容已覆盖"}</span></span>
          <Search className="size-4 text-[#98A2B3] transition-colors group-hover:text-[#344054]" />
        </Link>
        <Link href={filteredHref({ classification: null, translationState: null, seoState: "MISSING" })} className="group flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 transition-colors hover:border-[#B8C0CC]">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><SearchCheck className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#172033]">完善各语言 SEO</span><span className="mt-1 block text-xs text-[#667085]">{stats.missingSeo ? `${stats.missingSeo} 个产品的 SEO 字段不完整` : "九语言 SEO 已完整"}</span></span>
          <Search className="size-4 text-[#98A2B3] transition-colors group-hover:text-[#344054]" />
        </Link>
      </section>

      <details id="new-product" className="group mt-5 rounded-xl border border-white/[0.075] bg-[#111113] open:border-white/[0.12]">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
          <span className="grid size-7 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-zinc-400">
            <Plus className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-200">创建新产品</p>
            <p className="mt-0.5 text-[11px] text-zinc-600">先建立中文基础资料，创建后进入详情页继续完善。</p>
          </div>
          <ChevronDown className="ml-auto size-4 text-zinc-600 transition-transform group-open:rotate-180" />
        </summary>
        <form action={createProductAction} className="grid gap-4 border-t border-white/[0.07] p-4 lg:grid-cols-12">
          <div className="space-y-1.5 lg:col-span-3">
            <Label htmlFor="new-slug" className="admin-label">URL Slug</Label>
            <Input id="new-slug" name="slug" required minLength={3} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="spc-click-flooring" disabled={!databaseReady} className="admin-field" />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="new-sku" className="admin-label">SKU</Label>
            <Input id="new-sku" name="sku" required maxLength={80} placeholder="TY-NEW-001" disabled={!databaseReady} className="admin-field" />
          </div>
          <div className="space-y-1.5 lg:col-span-3">
            <Label htmlFor="new-category" className="admin-label">分类</Label>
            <select id="new-category" name="categoryId" required defaultValue={defaultCategoryId} disabled={!databaseReady || !categories.length} className="admin-select h-8 w-full px-2.5 text-xs">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.depth ? "↳ " : ""}{category.label}{category.isActive ? "" : "（已停用）"}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="new-status" className="admin-label">状态</Label>
            <select id="new-status" name="status" defaultValue="DRAFT" disabled={!databaseReady} className="admin-select h-8 w-full px-2.5 text-xs">
              {productStatuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="new-sort" className="admin-label">排序</Label>
            <Input id="new-sort" name="sortOrder" type="number" min={0} defaultValue={stats.total + 1} disabled={!databaseReady} className="admin-field" />
          </div>
          <div className="space-y-1.5 lg:col-span-5">
            <Label htmlFor="new-title" className="admin-label">中文标题</Label>
            <Input id="new-title" name="title" required minLength={3} maxLength={180} placeholder="例如：同步对花 SPC 锁扣地板" disabled={!databaseReady} className="admin-field" />
          </div>
          <div className="space-y-1.5 lg:col-span-7">
            <Label htmlFor="new-summary" className="admin-label">中文摘要</Label>
            <Textarea id="new-summary" name="summary" required minLength={20} maxLength={800} placeholder="用于产品列表、详情页和 SEO 描述的基础摘要，至少 20 个字符。" disabled={!databaseReady} className="admin-field min-h-16" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4 lg:col-span-12">
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input type="checkbox" name="featured" disabled={!databaseReady} className="admin-checkbox" />
              创建时设为精选产品
            </label>
            <Button type="submit" disabled={!databaseReady || !categories.length} className="bg-zinc-100 text-zinc-950 hover:bg-white">
              <Plus />
              创建并编辑
            </Button>
          </div>
        </form>
      </details>

      <section className="mt-5 rounded-xl border border-white/[0.075] bg-[#111113] p-3">
        <form action="/admin/products" className="grid gap-2 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative xl:col-span-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-700" />
            <Input id="q" name="q" defaultValue={filters.q || ""} placeholder="搜索产品名、SKU、slug 或分类…" className="admin-field pl-8" />
          </div>
          <select id="status" name="status" defaultValue={status || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部状态</option>
            {productStatuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
          </select>
          <select id="kind" name="kind" defaultValue={kind || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部产品类型</option>
            {productKinds.map((item) => <option key={item} value={item}>{kindLabel[item]}</option>)}
          </select>
          <select id="classification" name="classification" defaultValue={classification || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部归类状态</option>
            <option value="UNCLASSIFIED">未归类</option>
            <option value="CLASSIFIED">已归类</option>
          </select>
          <select id="locale" name="locale" defaultValue={locale || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部语言</option>
            {contentLocales.map((item) => <option key={item} value={item}>{languageMarkers[item]} {languageNames[item]}</option>)}
          </select>
          <select id="translationState" name="translationState" defaultValue={translationState || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部翻译状态</option>
            <option value="MISSING">翻译缺失</option>
            <option value="NOT_PUBLISHED">尚未发布</option>
          </select>
          <select id="seoState" name="seoState" defaultValue={seoState || ""} className="admin-select h-8 px-2.5 text-xs xl:col-span-2">
            <option value="">全部 SEO 状态</option>
            <option value="MISSING">SEO 待完善</option>
            <option value="READY">SEO 已完整</option>
          </select>
          <div className="flex items-center gap-2 md:col-span-2 xl:col-span-3">
            <Button type="submit" size="sm" variant="outline" className="flex-1 border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white">
              <Filter />
              筛选
            </Button>
            <Button asChild type="button" size="sm" variant="ghost" className="flex-1 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300">
              <Link href="/admin/products">清空</Link>
            </Button>
          </div>
        </form>
      </section>

      {!databaseReady ? (
        <Alert className="mt-5 border-amber-500/20 bg-amber-500/[0.06] text-amber-200">
          <Database className="size-4" />
          <AlertTitle>当前为只读示例数据</AlertTitle>
          <AlertDescription className="text-amber-200/60">配置 DATABASE_URL 并完成数据库初始化后，新增、编辑与批量操作会自动启用。</AlertDescription>
        </Alert>
      ) : null}

      <AdminProductCatalog
        products={catalogProducts}
        categories={categories}
        databaseReady={databaseReady}
        returnTo={returnTo}
        quickAction={updateProductListSettingsAction}
        quickCategoryAction={assignProductCategoryAction}
        batchAction={batchUpdateProductsAction}
      />

      <nav className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="产品分页">
        <p className="text-xs text-[#667085]">
          共 <span className="font-mono text-[#344054]">{productPage.total}</span> 个结果，当前第 <span className="font-mono text-[#344054]">{productPage.page}</span> / {productPage.totalPages} 页，每页 {productPage.pageSize} 个
        </p>
        <div className="flex items-center gap-2">
          <Button asChild={productPage.page > 1} size="sm" variant="outline" disabled={productPage.page <= 1}>
            {productPage.page > 1 ? <Link href={pageHref(productPage.page - 1)}>上一页</Link> : <span>上一页</span>}
          </Button>
          <Button asChild={productPage.page < productPage.totalPages} size="sm" variant="outline" disabled={productPage.page >= productPage.totalPages}>
            {productPage.page < productPage.totalPages ? <Link href={pageHref(productPage.page + 1)}>下一页</Link> : <span>下一页</span>}
          </Button>
        </div>
      </nav>
    </main>
  );
}

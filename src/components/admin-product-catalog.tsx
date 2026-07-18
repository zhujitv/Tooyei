"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertDialog } from "radix-ui";
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderInput,
  Grid2X2,
  ImageIcon,
  Languages,
  List,
  LoaderCircle,
  MoreHorizontal,
  Save,
  SearchX,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ContentStatus, ProductKind, TranslationStatus } from "@/generated/prisma/client";
import type { ProductPublicVisibilityReason } from "@/lib/product-publication";
import type { AdminProductCategoryOption, BatchProductOperation } from "@/lib/repositories/admin-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { contentLocales, languageMarkers, type ContentLocale } from "@/lib/site";

export type ProductCatalogItem = {
  slug: string;
  sku: string;
  category: string;
  categoryId: string | null;
  isClassified: boolean;
  publicVisible: boolean;
  publicVisibilityReasons: ProductPublicVisibilityReason[];
  kind: ProductKind;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  title: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  mediaStatus: "READY" | "MISSING" | "BROKEN";
  hasEnglishContent: boolean;
  englishContentStatus: "READY" | "MISSING" | "INCOMPLETE";
  englishMissingFields: string[];
  publicationReady: boolean;
  publicationMissingFields: string[];
  hasError: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  errorId: string | null;
  updatedAt: string | null;
  translationStates: Record<ContentLocale, TranslationStatus>;
  seoStates: Record<ContentLocale, boolean>;
  publishedTranslations: number;
  seoReadyTranslations: number;
  completion: number;
  contentCounts: {
    media: number;
    features: number;
    specifications: number;
    applications: number;
    downloads: number;
  };
};

type Props = {
  products: ProductCatalogItem[];
  categories: AdminProductCategoryOption[];
  databaseReady: boolean;
  canDelete: boolean;
  returnTo: string;
  quickAction: (formData: FormData) => Promise<void>;
  quickCategoryAction: (formData: FormData) => Promise<void>;
  batchAction: (formData: FormData) => Promise<void>;
};

const localeLabels: Record<ContentLocale, string> = {
  en: "EN", de: "DE", fr: "FR", es: "ES", ru: "RU", ja: "JA", it: "IT", ar: "AR", zh: "中",
};

const statusLabel: Record<ContentStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const statusClass: Record<ContentStatus, string> = {
  DRAFT: "admin-badge-neutral",
  PUBLISHED: "admin-badge-success",
  ARCHIVED: "admin-badge-missing",
};

const translationClass: Record<TranslationStatus, string> = {
  PUBLISHED: "admin-badge-success",
  NEEDS_REVIEW: "admin-badge-review",
  MACHINE_DRAFT: "admin-badge-ai",
  MISSING: "admin-badge-missing",
};

const publicVisibilityReasonLabel: Record<ProductPublicVisibilityReason, string> = {
  PRODUCT_NOT_PUBLISHED: "产品状态不是已发布",
  ENGLISH_SOURCE_MISSING: "英文内容未创建",
  ENGLISH_SOURCE_INCOMPLETE: "英文源内容不完整",
  ENGLISH_SOURCE_NOT_PUBLISHED: "英文源内容尚未审核发布",
  CATEGORY_NOT_PUBLIC: "没有已启用的前台栏目",
};

const publicationFieldLabel: Record<string, string> = {
  englishSource: "英文源内容",
  title: "英文标题",
  summary: "英文摘要",
  seoTitle: "英文 SEO 标题",
  seoDescription: "英文 SEO 描述",
  slug: "URL Slug",
  category: "产品栏目",
  media: "产品图片",
  features: "产品卖点",
  specifications: "产品规格",
};

const publicationMissingText = (product: ProductCatalogItem) =>
  product.publicationMissingFields.map((field) => publicationFieldLabel[field] ?? field).join("、");

const visibilityReasonText = (product: ProductCatalogItem) =>
  product.publicVisibilityReasons.map((reason) => publicVisibilityReasonLabel[reason]).join(" · ");

const kindLabel: Record<ProductKind, string> = {
  SPC: "SPC",
  ESPC: "ESPC",
  VSPC: "VSPC",
  LSPC: "LSPC",
  WPC: "WPC",
  LVT: "LVT",
  LAMINATE: "强化地板",
  WALL_PANEL: "墙板",
  ACCESSORY: "配件",
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Shanghai",
      }).format(new Date(value))
    : "—";

function ProductThumbnail({ product }: { product: ProductCatalogItem }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[#151517]">
      {product.thumbnailUrl ? (
        <div
          role="img"
          aria-label={product.thumbnailAlt || product.title}
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/card:scale-[1.025]"
          style={{ backgroundImage: `url(${JSON.stringify(product.thumbnailUrl)})` }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]">
          <ImageIcon className="size-8 text-zinc-800" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
      <Badge className={cn("absolute left-12 top-3 border", statusClass[product.status])}>{statusLabel[product.status]}</Badge>
      {product.featured ? (
        <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-md border border-violet-300/20 bg-violet-400/15 text-violet-200 backdrop-blur-md">
          <Sparkles className="size-3.5" />
          <span className="sr-only">精选产品</span>
        </span>
      ) : null}
      <Badge
        className={cn(
          "absolute bottom-3 right-3 gap-1 border backdrop-blur-md",
          product.publicVisible ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-200" : "border-amber-300/25 bg-amber-400/15 text-amber-100",
        )}
        title={product.publicVisible ? "满足当前产品中心公开条件" : visibilityReasonText(product)}
      >
        {product.publicVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        {product.publicVisible ? "产品中心可见" : "产品中心不可见"}
      </Badge>
    </div>
  );
}

function Completion({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-400" : value >= 55 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-600">资料完整度</span>
        <span className="font-mono text-zinc-300">{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProductMeta({ product }: { product: ProductCatalogItem }) {
  const structuredCount =
    product.contentCounts.features +
    product.contentCounts.specifications +
    product.contentCounts.applications +
    product.contentCounts.downloads;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {(Object.keys(product.translationStates) as ContentLocale[]).map((locale) => (
          <span
            key={locale}
            title={`${localeLabels[locale]}：${product.translationStates[locale]}；SEO ${product.seoStates[locale] ? "已完整" : "待完善"}`}
            className={cn(
              "relative grid h-5 min-w-6 place-items-center rounded border px-1 text-[9px] font-semibold",
              translationClass[product.translationStates[locale]],
              !product.seoStates[locale] && product.translationStates[locale] !== "MISSING" && "ring-1 ring-inset ring-amber-400/45",
            )}
          >
            <span aria-hidden>{languageMarkers[locale]}</span>{localeLabels[locale]}
            {!product.seoStates[locale] ? <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-amber-400" aria-hidden /> : null}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-zinc-700">更新于 {formatDate(product.updatedAt)}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
        <div className="px-3">
          <p className="font-mono text-sm text-zinc-300">{product.contentCounts.media}</p>
          <p className="mt-0.5 text-[9px] text-zinc-700">媒体</p>
        </div>
        <div className="px-3">
          <p className="font-mono text-sm text-zinc-300">{structuredCount}</p>
          <p className="mt-0.5 text-[9px] text-zinc-700">结构内容</p>
        </div>
        <div className="px-3">
          <p className="font-mono text-sm text-zinc-300">{product.seoReadyTranslations}/{contentLocales.length}</p>
          <p className="mt-0.5 text-[9px] text-zinc-700">SEO 就绪</p>
        </div>
      </div>
    </>
  );
}

function QuickSettings({
  product,
  categories,
  disabled,
  returnTo,
  action,
  categoryAction,
}: {
  product: ProductCatalogItem;
  categories: AdminProductCategoryOption[];
  disabled: boolean;
  returnTo: string;
  action: Props["quickAction"];
  categoryAction: Props["quickCategoryAction"];
}) {
  return (
    <details className="group/details border-t border-white/[0.06]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] text-zinc-600 transition-colors hover:bg-white/[0.025] hover:text-zinc-300">
        快速设置
        <MoreHorizontal className="size-4" />
      </summary>
      <form action={action} className="grid gap-3 border-t border-white/[0.06] bg-black/15 p-4">
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="returnTo" value={returnTo} />
        {product.status === "PUBLISHED" && !product.publicVisible ? (
          <div className="rounded-md border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-2 text-[10px] leading-4 text-amber-200/80">
            <span className="font-medium text-amber-200">状态已发布，但产品中心不可见：</span>{visibilityReasonText(product)}
          </div>
        ) : null}
        <div className="grid grid-cols-[1fr_88px] gap-2">
          <select name="status" defaultValue={product.status} disabled={disabled} className="admin-select h-8 px-2 text-xs">
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
          <Input name="sortOrder" type="number" min={0} defaultValue={product.sortOrder} disabled={disabled} className="admin-field h-8 text-xs" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input name="featured" type="checkbox" defaultChecked={product.featured} disabled={disabled} className="admin-checkbox" />
            精选产品
          </label>
          <Button type="submit" size="sm" disabled={disabled} className="bg-zinc-100 text-zinc-950 hover:bg-white">
            <Save />
            保存
          </Button>
        </div>
      </form>
      <form action={categoryAction} className="grid gap-2 border-t border-white/[0.06] bg-black/15 p-4">
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="text-[10px] font-medium text-zinc-600" htmlFor={`category-${product.slug}`}>快速归类</label>
        <div className="flex gap-2">
          <select id={`category-${product.slug}`} name="categoryId" defaultValue={product.categoryId ?? categories[0]?.id} disabled={disabled || !categories.length} className="admin-select h-8 min-w-0 flex-1 px-2 text-xs">
            {categories.map((category) => <option key={category.id} value={category.id}>{category.depth ? "↳ " : ""}{category.label}{category.isActive ? "" : "（停用）"}</option>)}
          </select>
          <Button type="submit" size="sm" disabled={disabled || !categories.length} variant="outline">
            <FolderInput />归类
          </Button>
        </div>
      </form>
    </details>
  );
}

function BatchSubmitButton({ operation, disabled }: { operation: BatchProductOperation; disabled: boolean }) {
  const { pending } = useFormStatus();
  const destructive = operation === "DELETE";
  return (
    <Button
      type="submit"
      size="sm"
      disabled={disabled || pending}
      className={destructive ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-zinc-100 text-zinc-950 hover:bg-white"}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : operation === "REVIEW" ? <ShieldCheck /> : destructive ? <Trash2 /> : null}
      {pending ? "处理中…" : destructive ? "删除产品" : "应用操作"}
    </Button>
  );
}

export function AdminProductCatalog({ products, categories, databaseReady, canDelete, returnTo, quickAction, quickCategoryAction, batchAction }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [batchOperation, setBatchOperation] = useState<BatchProductOperation>("PUBLISH");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const batchFormRef = useRef<HTMLFormElement>(null);
  const confirmedDeleteRef = useRef(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedSet.has(product.slug)),
    [products, selectedSet],
  );
  const publishBlockedProducts = useMemo(
    () => selectedProducts.filter((product) => !product.publicationReady),
    [selectedProducts],
  );
  const allSelected = products.length > 0 && selected.length === products.length;

  const toggleProduct = (slug: string) =>
    setSelected((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));

  const toggleAll = () => setSelected(allSelected ? [] : products.map((product) => product.slug));

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="admin-checkbox" />
            全选
          </label>
          <span className="h-4 w-px bg-white/[0.08]" />
          <span className="text-xs text-zinc-600">{products.length} 个产品</span>
        </div>
        <div className="flex items-center rounded-md border border-white/[0.08] bg-[#111113] p-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => setView("grid")}
            className={view === "grid" ? "bg-white/[0.08] text-white" : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"}
          >
            <Grid2X2 />
            <span className="sr-only">卡片视图</span>
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-white/[0.08] text-white" : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"}
          >
            <List />
            <span className="sr-only">列表视图</span>
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-white/[0.09] bg-[#101012] text-center">
          <div>
            <SearchX className="mx-auto size-7 text-zinc-700" />
            <p className="mt-3 text-sm font-medium text-zinc-300">没有匹配的产品</p>
            <p className="mt-1 text-xs text-zinc-600">调整关键词或筛选条件后重试。</p>
          </div>
        </div>
      ) : (
        <div className={cn(view === "grid" ? "grid gap-3 md:grid-cols-2 2xl:grid-cols-3" : "space-y-2")}>
          {products.map((product) => {
            const checked = selectedSet.has(product.slug);
            return (
              <article
                key={product.slug}
                className={cn(
                  "group/card relative overflow-hidden rounded-xl border bg-[#111113] transition-colors",
                  checked ? "border-violet-400/40 ring-1 ring-violet-400/15" : "border-white/[0.075] hover:border-white/[0.14]",
                  view === "list" && "grid md:grid-cols-[180px_1fr_240px]",
                )}
              >
                <label className="absolute left-3 top-3 z-10 grid size-6 cursor-pointer place-items-center rounded-md border border-white/15 bg-black/60 backdrop-blur-md">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(product.slug)}
                    className="peer sr-only"
                    aria-label={`选择 ${product.title}`}
                  />
                  <Check className="size-3.5 scale-0 text-white transition-transform peer-checked:scale-100" />
                </label>
                <ProductThumbnail product={product} />
                <div className="flex min-w-0 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                        <span>{kindLabel[product.kind]}</span>
                        <span className="size-0.5 rounded-full bg-zinc-700" />
                        <span className={cn("flex min-w-0 items-center gap-1 truncate normal-case tracking-normal", !product.isClassified && "text-rose-400")}>
                          {!product.isClassified ? <CircleAlert className="size-3 shrink-0" /> : null}
                          <span className="truncate">{product.isClassified ? product.category : "未归类"}</span>
                        </span>
                      </div>
                      <Link href={`/admin/products/${product.slug}`} className="mt-2 block truncate text-[15px] font-medium tracking-[-0.01em] text-zinc-100 hover:text-white">
                        {product.title}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[10px] text-zinc-700">{product.sku} · {product.slug}</p>
                      {product.hasError ? (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-rose-400/20 bg-rose-400/[0.07] px-2.5 py-2 text-[10px] leading-4 text-rose-200">
                          <CircleAlert className="mt-0.5 size-3 shrink-0" />
                          <span>{product.errorMessage} {product.errorId ? `错误编号：${product.errorId}` : ""}</span>
                        </p>
                      ) : product.englishContentStatus !== "READY" ? (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-rose-400/15 bg-rose-400/[0.055] px-2.5 py-2 text-[10px] leading-4 text-rose-200/80">
                          <Languages className="mt-0.5 size-3 shrink-0" />
                          <span>
                            {product.englishContentStatus === "MISSING"
                              ? "英文内容未创建"
                              : `英文内容不完整：${product.englishMissingFields.map((field) => publicationFieldLabel[field] ?? field).join("、")}`}
                          </span>
                        </p>
                      ) : null}
                      {product.mediaStatus !== "READY" ? (
                        <p className="mt-2 text-[10px] text-amber-300/75">
                          {product.mediaStatus === "BROKEN" ? "图片资源不可用，已显示占位图" : "尚未添加产品图片"}
                        </p>
                      ) : null}
                      {!product.publicVisible ? (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-400/15 bg-amber-400/[0.055] px-2.5 py-2 text-[10px] leading-4 text-amber-200/75">
                          <CircleAlert className="mt-0.5 size-3 shrink-0 text-amber-300" />
                          <span>{visibilityReasonText(product)}</span>
                        </p>
                      ) : null}
                    </div>
                    {product.publicVisible ? (
                      <Button asChild size="icon-sm" variant="ghost" className="text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-200">
                        <Link href={`/products/${product.slug}`} target="_blank">
                          <ExternalLink />
                          <span className="sr-only">查看公开页面</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button type="button" size="icon-sm" variant="ghost" disabled title={visibilityReasonText(product)}>
                        <EyeOff />
                        <span className="sr-only">产品中心暂不展示</span>
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    <Completion value={product.completion} />
                    <ProductMeta product={product} />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1"><Languages className="size-3" /> {product.publishedTranslations}/{contentLocales.length}</span>
                      <span className="flex items-center gap-1"><FileText className="size-3" /> SEO {product.seoReadyTranslations}/{contentLocales.length}</span>
                    </div>
                    <Button asChild size="sm" className="bg-zinc-100 text-zinc-950 hover:bg-white">
                      <Link href={`/admin/products/${product.slug}`}>编辑产品</Link>
                    </Button>
                  </div>
                </div>
                <div className={cn(view === "list" && "md:border-l md:border-white/[0.06]")}>
                  <QuickSettings product={product} categories={categories} disabled={!databaseReady} returnTo={returnTo} action={quickAction} categoryAction={quickCategoryAction} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected.length > 0 ? (
        <form
          ref={batchFormRef}
          action={batchAction}
          onSubmit={(event) => {
            if (batchOperation === "DELETE" && !confirmedDeleteRef.current) {
              event.preventDefault();
              setDeleteOpen(true);
              return;
            }
            if (batchOperation === "PUBLISH" && publishBlockedProducts.length > 0) {
              event.preventDefault();
              setPublishOpen(true);
              return;
            }
            confirmedDeleteRef.current = false;
          }}
          className="fixed bottom-5 left-1/2 z-40 flex w-[min(calc(100%-2rem),620px)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl border border-white/[0.12] bg-[#1a1a1d]/95 p-2.5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:left-[calc(50%+7.5rem)]"
        >
          {selected.map((slug) => <input key={slug} type="hidden" name="slugs" value={slug} />)}
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="flex min-w-28 items-center gap-2 px-2 text-xs font-medium text-zinc-200">
            <span className="grid size-5 place-items-center rounded bg-violet-400 text-[10px] font-bold text-violet-950">{selected.length}</span>
            已选择
          </div>
          <select name="operation" className={cn("admin-select h-8 min-w-36 flex-1 px-2 text-xs", batchOperation === "DELETE" && "border-rose-500/40 text-rose-300")} value={batchOperation} onChange={(event) => setBatchOperation(event.target.value as BatchProductOperation)}>
            <option value="REVIEW">批量审核通过</option>
            <option value="PUBLISH">批量发布</option>
            <option value="DRAFT">设为草稿</option>
            <option value="ARCHIVE">批量归档</option>
            <option value="FEATURE">设为精选</option>
            <option value="UNFEATURE">取消精选</option>
            <option value="ASSIGN_CATEGORY">批量归类</option>
            <option value="FILL_SEO">补齐已有翻译 SEO</option>
            {canDelete ? <option value="DELETE">永久删除</option> : null}
          </select>
          {batchOperation === "ASSIGN_CATEGORY" ? (
            <select name="categoryId" required className="admin-select h-8 min-w-44 flex-1 px-2 text-xs" defaultValue={categories[0]?.id}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.depth ? "↳ " : ""}{category.label}{category.isActive ? "" : "（停用）"}</option>)}
            </select>
          ) : null}
          <BatchSubmitButton operation={batchOperation} disabled={!databaseReady} />
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])} className="text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200">
            取消
          </Button>
          {batchOperation === "REVIEW" ? (
            <p className="basis-full px-2 text-[10px] text-zinc-500">审核通过会批准待审核语言版本；产品仍需执行“批量发布”后才会公开。</p>
          ) : null}
          {batchOperation === "PUBLISH" ? (
            <p className={cn("basis-full rounded-md px-2 py-1.5 text-[10px]", publishBlockedProducts.length ? "bg-amber-400/[0.08] text-amber-200/80" : "text-emerald-300/75")}>
              {publishBlockedProducts.length
                ? `${publishBlockedProducts.length} 个产品不满足英文源发布条件，系统将阻止本次批量发布。`
                : `所选 ${selected.length} 个产品均满足英文源发布条件。`}
            </p>
          ) : null}
        </form>
      ) : null}

      <AlertDialog.Root open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#101828]/45 backdrop-blur-[2px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-2xl">
            <div className="grid size-10 place-items-center rounded-full bg-amber-50 text-amber-600"><EyeOff className="size-5" /></div>
            <AlertDialog.Title className="mt-4 text-lg font-semibold text-[#172033]">有 {publishBlockedProducts.length} 个产品暂不能发布</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#667085]">
              英文是产品发布源。请先补齐英文内容、媒体、产品卖点、规格与栏目，系统不会以不完整资料更新发布状态。
            </AlertDialog.Description>
            <div className="mt-4 max-h-32 overflow-y-auto rounded-lg border border-[#E4E7EC] bg-[#F8FAFC] p-3 text-xs leading-5 text-[#667085]">
              {publishBlockedProducts.slice(0, 8).map((product) => <p key={product.slug}><span className="font-medium text-[#344054]">{product.sku}</span>：缺少 {publicationMissingText(product)}</p>)}
              {publishBlockedProducts.length > 8 ? <p>另有 {publishBlockedProducts.length - 8} 个产品</p> : null}
            </div>
            <div className="mt-6 flex justify-end">
              <AlertDialog.Cancel asChild><Button type="button">返回完善资料</Button></AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#101828]/45 backdrop-blur-[2px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-2xl">
            <div className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600"><Trash2 className="size-5" /></div>
            <AlertDialog.Title className="mt-4 text-lg font-semibold text-[#172033]">永久删除 {selected.length} 个产品？</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#667085]">
              产品资料、语言内容、图片关联和结构化内容将一并删除，且无法恢复。有关联询盘或翻译任务的产品会被系统阻止删除。
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild><Button type="button" variant="outline">取消</Button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  className="bg-rose-600 text-white hover:bg-rose-500"
                  onClick={() => {
                    confirmedDeleteRef.current = true;
                    setDeleteOpen(false);
                    batchFormRef.current?.requestSubmit();
                  }}
                >
                  <Trash2 />确认永久删除
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}

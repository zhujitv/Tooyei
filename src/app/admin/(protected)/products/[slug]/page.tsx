import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Database,
  ExternalLink,
  FileStack,
  ImageIcon,
  Save,
  SearchCheck,
  TriangleAlert,
} from "lucide-react";
import { ContentStatus, ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
import { AdminProductTabs, type ProductTabId } from "@/components/admin-product-tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductAssetUpload } from "@/components/product-asset-upload";
import { ProductStructuredContentEditor } from "@/components/product-structured-content-editor";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminProduct, getAdminProductCategoryOptions } from "@/lib/repositories/admin-products";
import { languageMarkers, languageNames } from "@/lib/site";
import {
  updateProductCoreAction,
  updateProductStructuredContentAction,
  updateProductTranslationAction,
  uploadProductAssetAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "产品编辑器", robots: { index: false, follow: false } };

const statuses = ["MISSING", "MACHINE_DRAFT", "NEEDS_REVIEW", "PUBLISHED"] as const;

const statusLabel: Record<(typeof statuses)[number], string> = {
  MISSING: "缺失",
  MACHINE_DRAFT: "机器草稿",
  NEEDS_REVIEW: "待审核",
  PUBLISHED: "已发布",
};

const translationStatusClass: Record<(typeof statuses)[number], string> = {
  MISSING: "border-white/[0.08] bg-white/[0.035] text-zinc-600",
  MACHINE_DRAFT: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  NEEDS_REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  PUBLISHED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

const productStatusLabel: Record<ContentStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const kindLabel: Record<string, string> = {
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

const mediaRoleLabel: Record<ProductMediaRole, string> = {
  PRIMARY: "主图",
  GALLERY: "图库",
  DETAIL: "详情图",
  APPLICATION: "应用图",
  PACKAGING: "包装图",
  VIDEO: "视频",
};

const downloadKindLabel: Record<ProductDownloadKind, string> = {
  CATALOG: "目录",
  SPEC_SHEET: "规格表",
  INSTALLATION_GUIDE: "安装指南",
  WARRANTY: "质保文件",
  CERTIFICATE: "认证证书",
  OTHER: "其他",
};

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Shanghai",
      }).format(date)
    : "—";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminProductEditPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const feedback = await searchParams;
  const [product, categories] = await Promise.all([getAdminProduct(slug), getAdminProductCategoryOptions()]);
  if (!product) notFound();

  const databaseReady = isDatabaseConfigured();
  const saveCoreAction = updateProductCoreAction.bind(null, slug);
  const saveTranslationAction = updateProductTranslationAction.bind(null, slug);
  const saveStructuredAction = updateProductStructuredContentAction.bind(null, slug);
  const uploadAssetAction = uploadProductAssetAction.bind(null, slug);

  const savedLocale =
    feedback.saved && !["core", "structured", "upload", "created"].includes(feedback.saved)
      ? feedback.saved.toUpperCase()
      : undefined;
  const initialTab: ProductTabId =
    feedback.saved === "upload"
      ? "media"
      : feedback.saved === "structured"
        ? "content"
        : savedLocale
          ? "languages"
          : "overview";

  const mediaRoleOptions = Object.values(ProductMediaRole).map((role) => ({ value: role, label: mediaRoleLabel[role] }));
  const downloadKindOptions = Object.values(ProductDownloadKind).map((kind) => ({ value: kind, label: downloadKindLabel[kind] }));
  const zhTranslation = product.translations.find((translation) => translation.locale === "zh");
  const publishedLocales = product.translations.filter((translation) => translation.status === "PUBLISHED").length;
  const seoReadyLocales = product.translations.filter((translation) => translation.seoTitle.trim() && translation.seoDescription.trim()).length;
  const primaryMedia = product.media.find((item) => item.role === ProductMediaRole.PRIMARY && item.visible) ?? product.media.find((item) => item.visible);
  const structuredCount = product.features.length + product.specifications.length + product.applications.length + product.downloads.length;

  const completenessSections = [
    { label: "基础资料", score: product.sku && (product.categoryId || !databaseReady) ? 15 : 0, weight: 15, tab: "overview" as ProductTabId },
    { label: "产品媒体", score: product.media.some((item) => item.visible) ? 20 : 0, weight: 20, tab: "media" as ProductTabId },
    { label: "多语言发布", score: Math.round((publishedLocales / product.translations.length) * 20), weight: 20, tab: "languages" as ProductTabId },
    { label: "SEO 字段", score: Math.round((seoReadyLocales / product.translations.length) * 15), weight: 15, tab: "languages" as ProductTabId },
    { label: "卖点", score: product.features.length ? 10 : 0, weight: 10, tab: "content" as ProductTabId },
    { label: "规格参数", score: product.specifications.length ? 10 : 0, weight: 10, tab: "content" as ProductTabId },
    { label: "应用场景", score: product.applications.length ? 5 : 0, weight: 5, tab: "content" as ProductTabId },
    { label: "下载资料", score: product.downloads.length ? 5 : 0, weight: 5, tab: "content" as ProductTabId },
  ];
  const completeness = completenessSections.reduce((sum, section) => sum + section.score, 0);
  const readinessItems = [
    ["至少 1 个可见媒体", product.media.some((item) => item.visible)],
    ["4 个语言版本均已发布", publishedLocales === product.translations.length],
    ["4 个语言版本 SEO 完整", seoReadyLocales === product.translations.length],
    ["已填写核心卖点", product.features.length > 0],
    ["已填写产品规格", product.specifications.length > 0],
    ["已填写应用场景", product.applications.length > 0],
    ["已关联下载资料", product.downloads.length > 0],
  ] as const;

  const overviewPanel = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="admin-card">
        <CardHeader className="border-b border-white/[0.065] pb-4">
          <CardTitle className="text-sm">基础信息</CardTitle>
          <p className="text-xs text-zinc-600">控制产品分类、发布状态、排序与公开可见性。</p>
        </CardHeader>
        <CardContent className="pt-1">
          <form action={saveCoreAction} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="admin-label">URL Slug</Label>
                <Input id="slug" value={product.slug} readOnly className="admin-field text-zinc-600" />
                <p className="text-[10px] text-zinc-700">URL 标识暂时只读，避免破坏已有索引。</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku" className="admin-label">SKU</Label>
                <Input id="sku" name="sku" defaultValue={product.sku} minLength={1} maxLength={80} required disabled={!databaseReady} className="admin-field" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="admin-label">主栏目</Label>
                <select id="categoryId" name="categoryId" defaultValue={product.categoryId ?? ""} required disabled={!databaseReady} className="admin-select h-8 w-full px-2.5 text-xs">
                  <option value="" disabled>请选择分类</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.depth ? "↳ " : ""}{category.label}{category.isActive ? "" : "（已停用）"}</option>)}
                </select>
                <p className="text-[10px] text-zinc-700">面包屑和产品默认归类优先使用主栏目，建议优先选择二级栏目。</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="admin-label">产品状态</Label>
                <select id="status" name="status" defaultValue={product.status} disabled={!databaseReady} className="admin-select h-8 w-full px-2.5 text-xs">
                  {Object.values(ContentStatus).map((status) => <option key={status} value={status}>{productStatusLabel[status]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortOrder" className="admin-label">排序值</Label>
                <Input id="sortOrder" name="sortOrder" type="number" min={0} max={999999} defaultValue={product.sortOrder} disabled={!databaseReady} className="admin-field" />
              </div>
              <div className="space-y-1.5">
                <Label className="admin-label">产品类型</Label>
                <div className="flex h-8 items-center rounded-md border border-white/[0.08] bg-white/[0.025] px-2.5 text-xs text-zinc-500">{kindLabel[product.kind]}</div>
              </div>
              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="admin-label">关联栏目（可多选）</legend>
                <div className="grid gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-xs text-zinc-500 hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        name="categoryIds"
                        value={category.id}
                        defaultChecked={product.categoryIds.includes(category.id) || product.categoryId === category.id}
                        disabled={!databaseReady}
                        className="admin-checkbox"
                      />
                      <span className="truncate">{category.depth ? "↳ " : ""}{category.label}</span>
                      {!category.isActive ? <span className="ml-auto rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-500">已停用</span> : null}
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-700">停用栏目仍保留并可在后台重新归类，前台不会显示该栏目。</p>
              </fieldset>
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-xs text-zinc-400">
              <input type="checkbox" name="featured" defaultChecked={product.featured} disabled={!databaseReady} className="admin-checkbox mt-0.5" />
              <span><span className="block font-medium text-zinc-300">精选产品</span><span className="mt-1 block text-[10px] text-zinc-700">在首页和产品目录中获得更高展示优先级。</span></span>
            </label>
            <div className="flex flex-col gap-3 border-t border-white/[0.065] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-zinc-700">最后更新：{formatDate(product.updatedAt)}</p>
              <Button type="submit" disabled={!databaseReady} className="bg-zinc-100 text-zinc-950 hover:bg-white">
                <Save />
                保存基础信息
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="admin-card">
          <CardHeader className="border-b border-white/[0.065] pb-4">
            <CardTitle className="flex items-center justify-between text-sm"><span>资料完整度</span><span className="font-mono text-lg text-zinc-100">{completeness}%</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {completenessSections.map((section) => (
              <div key={section.label}>
                <div className="flex items-center justify-between text-[10px]"><span className="text-zinc-600">{section.label}</span><span className={section.score === section.weight ? "font-mono text-emerald-400" : "font-mono text-zinc-500"}>{section.score}/{section.weight}</span></div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.055]"><div className={section.score === section.weight ? "h-full bg-emerald-400" : "h-full bg-amber-400"} style={{ width: `${(section.score / section.weight) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardHeader className="border-b border-white/[0.065] pb-4"><CardTitle className="text-sm">发布检查</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-1">
            {readinessItems.map(([label, ready]) => (
              <div key={label} className="flex items-center gap-2.5 py-1 text-xs">
                {ready ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Circle className="size-3.5 text-zinc-700" />}
                <span className={ready ? "text-zinc-400" : "text-zinc-600"}>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const mediaPanel = (
    <div className="space-y-5">
      <Card className="admin-card">
        <CardHeader className="border-b border-white/[0.065] pb-4">
          <CardTitle className="text-sm">上传媒体与文件</CardTitle>
          <p className="text-xs text-zinc-600">文件上传后会自动关联当前产品。</p>
        </CardHeader>
        <CardContent className="pt-1"><ProductAssetUpload action={uploadAssetAction} disabled={!databaseReady} /></CardContent>
      </Card>
      <Card className="admin-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.065] pb-4">
          <div><CardTitle className="text-sm">媒体库</CardTitle><p className="mt-1 text-xs text-zinc-600">当前已关联 {product.media.length} 项资源；排序和显示状态可在“内容结构”中调整。</p></div>
          <Badge variant="outline" className="border-white/[0.08] text-zinc-500">{product.media.filter((item) => item.visible).length} 项可见</Badge>
        </CardHeader>
        <CardContent className="pt-1">
          {product.media.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {product.media.map((item, index) => (
                <div key={`${item.url}-${index}`} className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0d0d0f]">
                  <div className="relative aspect-[4/3] bg-[#151517]">
                    {item.kind === "IMAGE" ? <div role="img" aria-label={item.alt || `产品媒体 ${index + 1}`} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(item.url)})` }} /> : <div className="absolute inset-0 grid place-items-center"><FileStack className="size-7 text-zinc-700" /></div>}
                    {!item.visible ? <span className="absolute inset-0 grid place-items-center bg-black/70 text-[10px] text-zinc-400">已隐藏</span> : null}
                  </div>
                  <div className="p-3"><div className="flex items-center justify-between"><span className="text-xs font-medium text-zinc-300">{mediaRoleLabel[item.role]}</span><span className="font-mono text-[9px] text-zinc-700">#{item.sortOrder}</span></div><p className="mt-1 truncate text-[10px] text-zinc-600">{item.alt || item.caption || "暂无说明"}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-white/[0.08] text-center"><div><ImageIcon className="mx-auto size-7 text-zinc-700" /><p className="mt-2 text-xs text-zinc-500">暂无媒体资源</p></div></div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const contentPanel = (
    <Card className="admin-card">
      <CardHeader className="border-b border-white/[0.065] pb-4">
        <CardTitle className="text-sm">结构化产品内容</CardTitle>
        <p className="text-xs text-zinc-600">统一管理图库排序、规格参数、卖点、应用场景和下载资料。</p>
      </CardHeader>
      <CardContent className="pt-1">
        <ProductStructuredContentEditor
          action={saveStructuredAction}
          disabled={!databaseReady}
          initial={{ media: product.media, features: product.features, specifications: product.specifications, applications: product.applications, downloads: product.downloads }}
          mediaRoleOptions={mediaRoleOptions}
          downloadKindOptions={downloadKindOptions}
        />
      </CardContent>
    </Card>
  );

  const languagesPanel = (
    <div className="grid gap-4 xl:grid-cols-2">
      {product.translations.map((translation) => {
        const seoReady = Boolean(translation.seoTitle.trim() && translation.seoDescription.trim());
        return (
          <Card key={translation.locale} className="admin-card">
            <CardHeader className="flex flex-row items-start justify-between border-b border-white/[0.065] pb-4">
              <div><CardTitle className="flex items-center gap-2 text-sm"><span aria-hidden>{languageMarkers[translation.locale]}</span>{languageNames[translation.locale]}<span className="font-mono text-[9px] font-normal uppercase text-zinc-700">{translation.locale}</span></CardTitle><p className="mt-1 text-[11px] text-zinc-600">独立控制内容、索引状态和搜索摘要。</p></div>
              <div className="flex items-center gap-1.5"><Badge className={`border ${translationStatusClass[translation.status]}`}>{statusLabel[translation.status]}</Badge><span title={seoReady ? "SEO 已完整" : "SEO 待完善"} className={seoReady ? "grid size-5 place-items-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "grid size-5 place-items-center rounded border border-amber-500/20 bg-amber-500/10 text-amber-400"}>{seoReady ? <Check className="size-3" /> : <SearchCheck className="size-3" />}</span></div>
            </CardHeader>
            <CardContent className="pt-1">
              <form action={saveTranslationAction} className="space-y-4">
                <input type="hidden" name="locale" value={translation.locale} />
                <div className="space-y-1.5"><Label htmlFor={`${translation.locale}-title`} className="admin-label">标题</Label><Input id={`${translation.locale}-title`} name="title" defaultValue={translation.title} minLength={3} maxLength={180} required disabled={!databaseReady} className="admin-field" /></div>
                <div className="space-y-1.5"><Label htmlFor={`${translation.locale}-summary`} className="admin-label">摘要</Label><Textarea id={`${translation.locale}-summary`} name="summary" defaultValue={translation.summary} minLength={20} maxLength={800} required disabled={!databaseReady} className="admin-field min-h-24" /></div>
                <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
                  <div className="space-y-1.5"><Label htmlFor={`${translation.locale}-seoTitle`} className="admin-label">SEO 标题</Label><Input id={`${translation.locale}-seoTitle`} name="seoTitle" defaultValue={translation.seoTitle} maxLength={220} disabled={!databaseReady} placeholder="为空时使用产品标题" className="admin-field" /></div>
                  <div className="space-y-1.5"><Label htmlFor={`${translation.locale}-status`} className="admin-label">发布状态</Label><select id={`${translation.locale}-status`} name="status" defaultValue={translation.status} disabled={!databaseReady} className="admin-select h-8 w-full px-2.5 text-xs">{statuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor={`${translation.locale}-seoDescription`} className="admin-label">SEO 描述</Label><Textarea id={`${translation.locale}-seoDescription`} name="seoDescription" defaultValue={translation.seoDescription} maxLength={360} disabled={!databaseReady} placeholder="为空时使用产品摘要" className="admin-field min-h-16" /></div>
                <div className="flex items-center justify-between border-t border-white/[0.065] pt-4"><span className={seoReady ? "flex items-center gap-1.5 text-[10px] text-emerald-400" : "flex items-center gap-1.5 text-[10px] text-amber-400"}>{seoReady ? <CheckCircle2 className="size-3" /> : <TriangleAlert className="size-3" />}{seoReady ? "SEO 字段已完整" : "SEO 标题或描述待补充"}</span><Button type="submit" size="sm" disabled={!databaseReady} className="bg-zinc-100 text-zinc-950 hover:bg-white"><Save />保存 {translation.locale.toUpperCase()}</Button></div>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <main className="admin-page">
      <Button asChild size="sm" variant="ghost" className="-ml-2 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300">
        <Link href="/admin/products"><ArrowLeft />返回产品</Link>
      </Button>

      <header className="mt-4 grid gap-5 border-b border-white/[0.075] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#151517] sm:block">
            {primaryMedia?.kind === "IMAGE" ? <div role="img" aria-label={primaryMedia.alt || zhTranslation?.title || product.sku} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(primaryMedia.url)})` }} /> : <div className="absolute inset-0 grid place-items-center"><ImageIcon className="size-6 text-zinc-700" /></div>}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/[0.09] text-zinc-500">{productStatusLabel[product.status]}</Badge>
              <span className="text-[10px] text-zinc-700">{kindLabel[product.kind]}</span>
              {product.featured ? <Badge className="border border-violet-500/20 bg-violet-500/10 text-violet-300">精选</Badge> : null}
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.035em] text-zinc-50">{zhTranslation?.title || "产品编辑器"}</h1>
            <p className="mt-1.5 font-mono text-[10px] text-zinc-700">{product.sku} · {product.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2">
            <div className="relative grid size-9 place-items-center rounded-full" style={{ background: `conic-gradient(${completeness >= 80 ? "#34d399" : "#fbbf24"} ${completeness * 3.6}deg, rgba(255,255,255,.06) 0deg)` }}><div className="absolute inset-[3px] rounded-full bg-[#111113]" /><span className="relative font-mono text-[9px] text-zinc-300">{completeness}</span></div>
            <div><p className="text-[10px] text-zinc-600">资料完整度</p><p className="mt-0.5 text-xs font-medium text-zinc-300">{completeness >= 80 ? "接近发布标准" : completeness >= 55 ? "继续完善资料" : "资料缺失较多"}</p></div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-white/[0.1] bg-white/[0.035] text-zinc-300 hover:bg-white/[0.08] hover:text-white"><Link href={`/products/${product.slug}`} target="_blank"><ExternalLink />公开页面</Link></Button>
        </div>
      </header>

      {feedback.saved ? (
        <Alert className="mt-5 border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-200"><Save className="size-4" /><AlertTitle>{feedback.saved === "core" ? "产品基础信息已保存" : feedback.saved === "created" ? "新产品已创建" : feedback.saved === "upload" ? "文件已上传并关联" : feedback.saved === "structured" ? "产品结构化内容已保存" : "翻译已保存"}</AlertTitle><AlertDescription className="text-emerald-200/60">{feedback.saved === "core" ? "产品列表、公开页面和缓存已刷新。" : feedback.saved === "created" ? "可以继续完善图片、规格、卖点、应用场景、下载资料和多语言 SEO。" : feedback.saved === "upload" ? "对象存储和产品媒体关系已更新。" : feedback.saved === "structured" ? "图库、规格、卖点、应用场景和下载资料已同步到公开产品页。" : `${savedLocale} 版本、SEO 字段和公开页面缓存已更新。`}</AlertDescription></Alert>
      ) : null}
      {feedback.error ? (
        <Alert className="mt-5 border-amber-500/20 bg-amber-500/[0.07] text-amber-200"><Database className="size-4" /><AlertTitle>修改未保存</AlertTitle><AlertDescription className="text-amber-200/60">{feedback.error === "database" ? "请先连接 PostgreSQL 并初始化产品目录。" : feedback.error === "core" ? "请检查 SKU、分类、状态和排序。" : feedback.error === "structured" ? "请检查结构化内容字段。" : feedback.error === "upload" ? "请检查文件类型、大小、Blob 配置和数据库连接。" : "请检查标题、摘要、SEO 字段和发布状态。"}</AlertDescription></Alert>
      ) : null}

      <AdminProductTabs
        initialTab={initialTab}
        counts={{ media: product.media.length, content: structuredCount, languages: publishedLocales }}
        overview={overviewPanel}
        media={mediaPanel}
        content={contentPanel}
        languages={languagesPanel}
      />
    </main>
  );
}

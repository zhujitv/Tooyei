import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, ExternalLink, Save } from "lucide-react";
import { ContentStatus, ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
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
import { languageNames } from "@/lib/site";
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
  const product = await getAdminProduct(slug);
  if (!product) notFound();

  const databaseReady = isDatabaseConfigured();
  const categories = await getAdminProductCategoryOptions();
  const saveCoreAction = updateProductCoreAction.bind(null, slug);
  const saveTranslationAction = updateProductTranslationAction.bind(null, slug);
  const saveStructuredAction = updateProductStructuredContentAction.bind(null, slug);
  const uploadAssetAction = uploadProductAssetAction.bind(null, slug);

  const savedLocale =
    feedback.saved && !["core", "structured", "upload", "created"].includes(feedback.saved)
      ? feedback.saved.toUpperCase()
      : undefined;

  const mediaRoleOptions = Object.values(ProductMediaRole).map((role) => ({ value: role, label: mediaRoleLabel[role] }));
  const downloadKindOptions = Object.values(ProductDownloadKind).map((kind) => ({
    value: kind,
    label: downloadKindLabel[kind],
  }));
  const zhTranslation = product.translations.find((translation) => translation.locale === "zh");
  const publishedLocales = product.translations.filter((translation) => translation.status === "PUBLISHED").length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <Button asChild variant="ghost" className="-ml-3 text-white/60 hover:bg-white/10 hover:text-white">
        <Link href="/admin/products">
          <ArrowLeft />
          产品
        </Link>
      </Button>

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.095),rgba(255,255,255,0.035))] shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <p className="font-mono text-xs tracking-[0.16em] text-[#d6b36a]">
              {product.sku} · {product.slug}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {zhTranslation?.title || "产品编辑器"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
              集中管理基础信息、多语言 SEO、产品图库、规格参数、卖点、应用场景和下载资料。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
                <Link href={`/products/${product.slug}`} target="_blank">
                  <ExternalLink />
                  查看公开页
                </Link>
              </Button>
              <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
                <Database className="size-3.5" />
                {databaseReady ? "可保存" : "只读"}
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["发布状态", productStatusLabel[product.status]],
              ["类型", kindLabel[product.kind]],
              ["可见媒体", `${product.media.filter((item) => item.visible).length} 项`],
              ["发布语言", `${publishedLocales}/${product.translations.length}`],
              ["结构模块", `${product.features.length + product.specifications.length + product.applications.length} 项`],
              ["最后更新", formatDate(product.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#050a13]/30 p-4">
                <p className="text-xs text-white/35">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white/80">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {feedback.saved ? (
        <Alert className="mt-7 border-emerald-500/30 bg-emerald-500/8 text-emerald-100">
          <Save className="size-4" />
          <AlertTitle>
            {feedback.saved === "core"
              ? "产品基础信息已保存"
              : feedback.saved === "created"
                ? "新产品已创建"
              : feedback.saved === "upload"
                ? "文件已上传并关联"
              : feedback.saved === "structured"
                ? "产品结构化内容已保存"
                : "翻译已保存"}
          </AlertTitle>
          <AlertDescription className="text-emerald-100/65">
            {feedback.saved === "core"
              ? "产品列表、公开页面和缓存已刷新。"
              : feedback.saved === "created"
                ? "可以继续完善图片、规格、卖点、应用场景、下载资料和多语言 SEO。"
              : feedback.saved === "upload"
                ? "对象存储和产品媒体关系已更新。"
              : feedback.saved === "structured"
                ? "图库、规格、卖点、应用场景和下载资料已同步到公开产品页。"
                : `${savedLocale} 版本、SEO 字段和公开页面缓存已更新。`}
          </AlertDescription>
        </Alert>
      ) : null}

      {feedback.error ? (
        <Alert className="mt-7 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>修改未保存</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            {feedback.error === "database"
              ? "请先连接 PostgreSQL 并初始化产品目录。"
              : feedback.error === "core"
                ? "请检查 SKU、分类、状态和排序。"
                : feedback.error === "structured"
                  ? "请检查结构化内容格式，每行使用英文竖线 | 分隔。"
                  : feedback.error === "upload"
                    ? "请检查文件类型、大小、Blob 配置和数据库连接。"
                  : "请检查标题、摘要、SEO 字段和发布状态。"}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-8 admin-card rounded-3xl">
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <p className="text-sm text-white/40">这些字段直接影响产品列表排序、公开可见性和产品分类。</p>
        </CardHeader>
        <CardContent>
          <form action={saveCoreAction} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" value={product.slug} readOnly className="border-white/10 bg-white/[0.07] text-white/55" />
                <p className="text-xs text-white/35">Slug 暂时只读；修改 URL 需要同步创建旧链接跳转。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={product.sku}
                  minLength={1}
                  maxLength={80}
                  required
                  disabled={!databaseReady}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">产品分类</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={product.categoryId ?? ""}
                  required
                  disabled={!databaseReady}
                  className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                >
                  <option value="" disabled>
                    请选择分类
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label} · {kindLabel[category.kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">产品状态</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={product.status}
                  disabled={!databaseReady}
                  className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                >
                  {Object.values(ContentStatus).map((status) => (
                    <option key={status} value={status}>
                      {productStatusLabel[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序值</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={999999}
                  defaultValue={product.sortOrder}
                  disabled={!databaseReady}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label>当前类型</Label>
                <div className="flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white/60">
                  {kindLabel[product.kind]}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product.featured}
                disabled={!databaseReady}
                className="size-4 accent-[#b68a4c] disabled:opacity-60"
              />
              设为精选产品，用于首页和产品排序优先展示
            </label>
            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/35">最后更新：{formatDate(product.updatedAt)}</p>
              <Button type="submit" disabled={!databaseReady} className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
                <Save />
                保存基础信息
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8 admin-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>媒体上传</CardTitle>
          <p className="text-sm text-white/40">上传图片、视频或资料后会自动关联当前产品；下方仍可继续调整排序和显示状态。</p>
        </CardHeader>
        <CardContent>
          <ProductAssetUpload action={uploadAssetAction} disabled={!databaseReady} />
        </CardContent>
      </Card>

      <Card className="mt-8 admin-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>结构化内容管理</CardTitle>
          <p className="text-sm text-white/40">
            用行级字段维护产品图片、规格、卖点、应用场景和下载资料，不再需要手动编写分隔符格式。
          </p>
        </CardHeader>
        <CardContent>
          <ProductStructuredContentEditor
            action={saveStructuredAction}
            disabled={!databaseReady}
            initial={{
              media: product.media,
              features: product.features,
              specifications: product.specifications,
              applications: product.applications,
              downloads: product.downloads,
            }}
            mediaRoleOptions={mediaRoleOptions}
            downloadKindOptions={downloadKindOptions}
          />
        </CardContent>
      </Card>

      <div className="mt-8 space-y-6">
        {product.translations.map((translation) => (
          <Card key={translation.locale} className="admin-card rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{languageNames[translation.locale]}</CardTitle>
                <p className="mt-1 text-sm text-white/40">标题、摘要和 SEO 字段会影响公开产品页。</p>
              </div>
              <Badge variant="outline" className="border-white/15 text-white/60">
                {statusLabel[translation.status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <form action={saveTranslationAction} className="space-y-5">
                <input type="hidden" name="locale" value={translation.locale} />
                <div className="space-y-2">
                  <Label htmlFor={`${translation.locale}-title`}>标题</Label>
                  <Input
                    id={`${translation.locale}-title`}
                    name="title"
                    defaultValue={translation.title}
                    minLength={3}
                    maxLength={180}
                    required
                    disabled={!databaseReady}
                    className="admin-field disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${translation.locale}-summary`}>摘要</Label>
                  <Textarea
                    id={`${translation.locale}-summary`}
                    name="summary"
                    defaultValue={translation.summary}
                    minLength={20}
                    maxLength={800}
                    required
                    disabled={!databaseReady}
                    className="min-h-28 admin-field disabled:opacity-60"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${translation.locale}-seoTitle`}>SEO 标题</Label>
                    <Input
                      id={`${translation.locale}-seoTitle`}
                      name="seoTitle"
                      defaultValue={translation.seoTitle}
                      maxLength={220}
                      disabled={!databaseReady}
                      placeholder="为空时使用产品标题"
                      className="admin-field placeholder:text-white/25 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${translation.locale}-status`}>发布状态</Label>
                    <select
                      id={`${translation.locale}-status`}
                      name="status"
                      defaultValue={translation.status}
                      disabled={!databaseReady}
                      className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${translation.locale}-seoDescription`}>SEO 描述</Label>
                  <Textarea
                    id={`${translation.locale}-seoDescription`}
                    name="seoDescription"
                    defaultValue={translation.seoDescription}
                    maxLength={360}
                    disabled={!databaseReady}
                    placeholder="为空时使用产品摘要"
                    className="min-h-20 admin-field placeholder:text-white/25 disabled:opacity-60"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!databaseReady} className="bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">
                    <Save />
                    保存 {translation.locale.toUpperCase()}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

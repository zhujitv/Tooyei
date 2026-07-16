import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, ImageIcon, ListChecks, Save } from "lucide-react";
import { ContentStatus, ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminProduct, getAdminProductCategoryOptions } from "@/lib/repositories/admin-products";
import { languageNames } from "@/lib/site";
import {
  updateProductCoreAction,
  updateProductStructuredContentAction,
  updateProductTranslationAction,
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

const visibleText = (visible: boolean) => (visible ? "显示" : "隐藏");

const safeCell = (value: string) => value.replaceAll("|", "｜").replace(/\s*\r?\n\s*/g, " ").trim();

const serializeRows = (rows: string[][]) => rows.map((row) => row.map(safeCell).join(" | ")).join("\n");

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

  const savedLocale =
    feedback.saved && !["core", "structured"].includes(feedback.saved) ? feedback.saved.toUpperCase() : undefined;

  const mediaValue = serializeRows(
    product.media.map((item) => [
      item.role,
      item.url,
      item.alt,
      item.caption,
      String(item.sortOrder),
      visibleText(item.visible),
    ]),
  );
  const featureValue = serializeRows(
    product.features.map((item) => [
      item.title,
      item.description,
      item.icon,
      String(item.sortOrder),
      visibleText(item.visible),
    ]),
  );
  const specificationValue = serializeRows(
    product.specifications.map((item) => [
      item.group,
      item.label,
      item.value,
      item.unit,
      String(item.sortOrder),
      visibleText(item.visible),
    ]),
  );
  const applicationValue = serializeRows(
    product.applications.map((item) => [
      item.title,
      item.description,
      item.imageUrl,
      item.imageAlt,
      String(item.sortOrder),
      visibleText(item.visible),
    ]),
  );
  const downloadValue = serializeRows(
    product.downloads.map((item) => [
      item.kind,
      item.title,
      item.url,
      item.description,
      String(item.sortOrder),
      visibleText(item.visible),
    ]),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <Button asChild variant="ghost" className="-ml-3 text-white/60 hover:bg-white/10 hover:text-white">
        <Link href="/admin/products">
          <ArrowLeft />
          产品
        </Link>
      </Button>

      <div className="mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs tracking-[0.16em] text-[#d56a5d]">
            {product.sku} · {product.slug}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">产品编辑器</h1>
          <p className="mt-3 text-sm text-white/45">
            基础信息、多语言 SEO、图库、规格参数、卖点、应用场景和下载资料集中管理。
          </p>
        </div>
        <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}>
          <Database className="size-3.5" />
          {databaseReady ? "可保存" : "只读"}
        </Badge>
      </div>

      {feedback.saved ? (
        <Alert className="mt-7 border-emerald-500/30 bg-emerald-500/8 text-emerald-100">
          <Save className="size-4" />
          <AlertTitle>
            {feedback.saved === "core"
              ? "产品基础信息已保存"
              : feedback.saved === "structured"
                ? "产品结构化内容已保存"
                : "翻译已保存"}
          </AlertTitle>
          <AlertDescription className="text-emerald-100/65">
            {feedback.saved === "core"
              ? "产品列表、公开页面和缓存已刷新。"
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
                  : "请检查标题、摘要、SEO 字段和发布状态。"}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <p className="text-sm text-white/40">这些字段直接影响产品列表排序、公开可见性和产品分类。</p>
        </CardHeader>
        <CardContent>
          <form action={saveCoreAction} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" value={product.slug} readOnly className="border-white/10 bg-black/30 text-white/55" />
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
                  className="border-white/10 bg-black/20 disabled:opacity-60"
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
                  className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
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
                  className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
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
                  className="border-white/10 bg-black/20 disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label>当前类型</Label>
                <div className="flex h-9 items-center rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white/60">
                  {kindLabel[product.kind]}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product.featured}
                disabled={!databaseReady}
                className="size-4 accent-[#a63429] disabled:opacity-60"
              />
              设为精选产品，用于首页和产品排序优先展示
            </label>
            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/35">最后更新：{formatDate(product.updatedAt)}</p>
              <Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]">
                <Save />
                保存基础信息
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-5 text-[#d56a5d]" />
                结构化内容
              </CardTitle>
              <p className="mt-2 text-sm text-white/40">
                当前先以中文为主录入；其他语言前台会回退中文，后续再进入结构化字段翻译。
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-xs text-white/45">
              <span className="rounded-lg bg-black/20 px-3 py-2">图库 {product.media.length}</span>
              <span className="rounded-lg bg-black/20 px-3 py-2">卖点 {product.features.length}</span>
              <span className="rounded-lg bg-black/20 px-3 py-2">参数 {product.specifications.length}</span>
              <span className="rounded-lg bg-black/20 px-3 py-2">场景 {product.applications.length}</span>
              <span className="rounded-lg bg-black/20 px-3 py-2">资料 {product.downloads.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={saveStructuredAction} className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label htmlFor="media">产品图片 / 图库</Label>
                <Badge variant="outline" className="border-white/15 text-white/50">
                  {Object.values(ProductMediaRole).map((role) => `${role}=${mediaRoleLabel[role]}`).join(" · ")}
                </Badge>
              </div>
              <Textarea
                id="media"
                name="media"
                defaultValue={mediaValue}
                disabled={!databaseReady}
                placeholder="PRIMARY | /media/product.jpg | 图片ALT | 图片说明 | 0 | 显示"
                className="min-h-36 border-white/10 bg-black/30 font-mono text-xs disabled:opacity-60"
              />
              <p className="mt-2 text-xs text-white/35">格式：角色 | 图片URL | ALT | 说明 | 排序 | 显示/隐藏</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <Label htmlFor="features">卖点模块</Label>
                <Textarea
                  id="features"
                  name="features"
                  defaultValue={featureValue}
                  disabled={!databaseReady}
                  placeholder="100% 防水 | 适合厨房、浴室和商业空间 | shield | 0 | 显示"
                  className="mt-3 min-h-44 border-white/10 bg-black/30 font-mono text-xs disabled:opacity-60"
                />
                <p className="mt-2 text-xs text-white/35">格式：标题 | 描述 | 图标代号 | 排序 | 显示/隐藏</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <Label htmlFor="specifications">产品参数表</Label>
                <Textarea
                  id="specifications"
                  name="specifications"
                  defaultValue={specificationValue}
                  disabled={!databaseReady}
                  placeholder="结构 | 总厚度 | 5.0 | mm | 0 | 显示"
                  className="mt-3 min-h-44 border-white/10 bg-black/30 font-mono text-xs disabled:opacity-60"
                />
                <p className="mt-2 text-xs text-white/35">格式：分组 | 参数名 | 参数值 | 单位 | 排序 | 显示/隐藏</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <Label htmlFor="applications">应用场景</Label>
                <Textarea
                  id="applications"
                  name="applications"
                  defaultValue={applicationValue}
                  disabled={!databaseReady}
                  placeholder="酒店客房 | 防水耐磨，适合中高人流项目 | /media/hotel.jpg | 酒店地板应用 | 0 | 显示"
                  className="mt-3 min-h-44 border-white/10 bg-black/30 font-mono text-xs disabled:opacity-60"
                />
                <p className="mt-2 text-xs text-white/35">格式：标题 | 描述 | 图片URL | 图片ALT | 排序 | 显示/隐藏</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label htmlFor="downloads">下载资料</Label>
                  <Badge variant="outline" className="border-white/15 text-white/50">
                    {Object.values(ProductDownloadKind)
                      .map((kind) => `${kind}=${downloadKindLabel[kind]}`)
                      .join(" · ")}
                  </Badge>
                </div>
                <Textarea
                  id="downloads"
                  name="downloads"
                  defaultValue={downloadValue}
                  disabled={!databaseReady}
                  placeholder="SPEC_SHEET | TY602 规格表 | /downloads/ty602.pdf | 含尺寸、包装和技术参数 | 0 | 显示"
                  className="min-h-44 border-white/10 bg-black/30 font-mono text-xs disabled:opacity-60"
                />
                <p className="mt-2 text-xs text-white/35">格式：类型 | 标题 | 文件URL | 描述 | 排序 | 显示/隐藏</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-white/35">
                <ImageIcon className="size-4" />
                当前阶段管理 URL；文件上传和对象存储可在下一阶段接入。
              </p>
              <Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]">
                <Save />
                保存结构化内容
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-6">
        {product.translations.map((translation) => (
          <Card key={translation.locale} className="border-white/10 bg-[#1a1e1a] text-white shadow-none">
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
                    className="border-white/10 bg-black/20 disabled:opacity-60"
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
                    className="min-h-28 border-white/10 bg-black/20 disabled:opacity-60"
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
                      className="border-white/10 bg-black/20 placeholder:text-white/25 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${translation.locale}-status`}>发布状态</Label>
                    <select
                      id={`${translation.locale}-status`}
                      name="status"
                      defaultValue={translation.status}
                      disabled={!databaseReady}
                      className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60"
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
                    className="min-h-20 border-white/10 bg-black/20 placeholder:text-white/25 disabled:opacity-60"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]">
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

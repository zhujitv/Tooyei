import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, CheckCircle2, ExternalLink, FileText, Languages, TriangleAlert } from "lucide-react";
import { ArticleKind, ContentStatus, Locale, TranslationStatus } from "@/generated/prisma/client";
import { AdminDatabaseUnavailable } from "@/components/admin-database-health";
import { validateArticleSource } from "@/lib/article-publication";
import { ArticleContentEditor } from "@/components/article-content-editor";
import { ArticleImageField } from "@/components/article-image-field";
import { ArticleSeoFields } from "@/components/article-seo-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { getRequestDatabaseHealth } from "@/lib/database-health";
import {
  classifyDatabaseError,
  databaseHealthResult,
  type DatabaseHealthResult,
} from "@/lib/database-health-status";
import { logError } from "@/lib/observability";
import { getAdminArticle } from "@/lib/repositories/admin-articles";
import { getArticleCategoryOptions } from "@/lib/repositories/article-categories";
import { articleTranslationLocales } from "@/lib/repositories/article-translation-jobs";
import { getTranslationProviderState } from "@/lib/translation-providers/config";
import {
  createArticleTranslationJobAction,
  saveArticleCoreAction,
  saveArticleTranslationAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "编辑文章", robots: { index: false, follow: false } };

const localeMeta = {
  EN: ["🇬🇧", "English", "英语"], DE: ["🇩🇪", "Deutsch", "德语"], FR: ["🇫🇷", "Français", "法语"],
  ES: ["🇪🇸", "Español", "西班牙语"], RU: ["🇷🇺", "Русский", "俄语"], JA: ["🇯🇵", "日本語", "日语"],
  IT: ["🇮🇹", "Italiano", "意大利语"], AR: ["🇸🇦", "العربية", "阿拉伯语"], ZH: ["🇨🇳", "中文", "中文"],
} as const;
const statusLabel: Record<TranslationStatus, string> = {
  MISSING: "缺失", MACHINE_DRAFT: "机器草稿", NEEDS_REVIEW: "待审核", PUBLISHED: "已发布",
};
const jobStatusLabel: Record<string, string> = {
  PENDING: "待处理", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL_FAILED: "部分失败", FAILED: "失败",
};

type AdminArticleRecord = NonNullable<Awaited<ReturnType<typeof getAdminArticle>>>;

const toMediaAssetOption = (asset: NonNullable<AdminArticleRecord["coverAsset"]>): MediaAssetOption => ({
  id: asset.id,
  url: asset.url,
  pathname: asset.pathname,
  filename: asset.originalFilename || asset.pathname.split("/").pop() || "文章封面",
  mimeType: asset.mimeType,
  sizeBytes: asset.sizeBytes,
  width: asset.width,
  height: asset.height,
  assetType: asset.assetType,
  storageProvider: asset.storageProvider,
  uploadedAt: asset.uploadedAt?.toISOString() ?? null,
  createdAt: asset.createdAt.toISOString(),
  orphaned: false,
  referenceCount: 1,
  references: [],
});

function ArticleDatabaseUnavailablePage({ database }: { database: DatabaseHealthResult }) {
  return (
    <main className="admin-page max-w-5xl">
      <header className="border-b border-[#E4E7EC] pb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-[#667085]"><Link href="/admin/articles"><ArrowLeft className="size-4" />返回文章列表</Link></Button>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">文章编辑暂时不可用</h1>
        <p className="mt-1.5 text-sm text-[#667085]">数据库恢复后可在当前页面重新检测并继续编辑。</p>
      </header>
      <AdminDatabaseUnavailable initialHealth={database} />
    </main>
  );
}

export default async function ArticleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string; error?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const selectedLocale = articleTranslationLocales.includes(query.locale as (typeof articleTranslationLocales)[number])
    ? query.locale as (typeof articleTranslationLocales)[number]
    : Locale.EN;
  let database = await getRequestDatabaseHealth();
  if (!database.connected) {
    return <ArticleDatabaseUnavailablePage database={database} />;
  }
  let article: Awaited<ReturnType<typeof getAdminArticle>>;
  let categories: Awaited<ReturnType<typeof getArticleCategoryOptions>>;
  try {
    [article, categories] = await Promise.all([
      getAdminArticle(id, selectedLocale),
      getArticleCategoryOptions(),
    ]);
  } catch (error) {
    const status = classifyDatabaseError(error);
    logError("Admin article detail could not be loaded", {
      operation: "admin-articles.detail-page",
      articleId: id,
      selectedLocale,
      status,
    }, error);
    database = databaseHealthResult(status);
    return <ArticleDatabaseUnavailablePage database={database} />;
  }
  if (!article) notFound();
  const provider = getTranslationProviderState();
  const selected = article.selectedTranslation;
  const english = article.englishTranslation;
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const sourceValidation = validateArticleSource(english);
  const localeStatus = (locale: (typeof articleTranslationLocales)[number]) =>
    article.translations.find((translation) => translation.locale === locale)?.status ?? TranslationStatus.MISSING;
  const categoryName = (category: (typeof categories)[number]) =>
    category.translations.find((translation) => translation.locale === Locale.ZH)?.name
    || category.translations.find((translation) => translation.locale === Locale.EN)?.name
    || category.slug;

  return (
    <main className="admin-page">
      <header className="flex flex-col gap-4 border-b border-[#E4E7EC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0"><Button asChild variant="ghost" size="sm" className="-ml-3 text-[#667085]"><Link href="/admin/articles"><ArrowLeft className="size-4" />返回文章列表</Link></Button><div className="mt-4 flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F2F4F7] text-[#344054]"><FileText className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-semibold tracking-[-0.035em] text-[#172033]">{english?.title || article.slug}</h1><Badge variant="outline" className={article.status === ContentStatus.PUBLISHED ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#D0D5DD] bg-white text-[#667085]"}>{article.status}</Badge></div><p className="mt-1.5 font-mono text-xs text-[#98A2B3]">/insights/{article.slug}</p></div></div></div>
        {article.status === ContentStatus.PUBLISHED ? <Button asChild variant="outline"><Link href={`/en/insights/${article.slug}`} target="_blank">查看英文页面<ExternalLink className="size-3.5" /></Link></Button> : null}
      </header>

      {query.error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><TriangleAlert className="size-4" /><AlertTitle>保存失败</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : null}
      {query.saved ? <Alert className="mt-5 border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-4" /><AlertTitle>已保存</AlertTitle><AlertDescription>{query.saved === "translation-job" ? "翻译任务已进入 Worker 队列。" : "文章内容和 SEO 状态已经更新。"}</AlertDescription></Alert> : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
        <form action={saveArticleCoreAction} className="admin-card p-5">
          <input type="hidden" name="id" value={article.id} />
          <div><h2 className="text-sm font-semibold text-[#172033]">发布与基础设置</h2><p className="mt-1 text-xs text-[#667085]">公开发布要求英文版本完整且已经发布；其他语言可独立审核上线。</p></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="slug">URL Slug</Label><Input id="slug" name="slug" required defaultValue={article.slug} /></div><div className="space-y-1.5"><Label htmlFor="categoryId">所属文章栏目</Label><select id="categoryId" name="categoryId" required defaultValue={article.categoryId} className="admin-select h-10 w-full px-3">{categories.map((category) => <option key={category.id} value={category.id}>{categoryName(category)}{category.isActive ? "" : "（已停用）"}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="kind">内容形式（内部）</Label><select id="kind" name="kind" defaultValue={article.kind} className="admin-select h-10 w-full px-3">{Object.values(ArticleKind).map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="status">文章状态</Label><select id="status" name="status" defaultValue={article.status} className="admin-select h-10 w-full px-3">{Object.values(ContentStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="authorName">作者</Label><Input id="authorName" name="authorName" defaultValue={article.authorName ?? ""} /></div><div className="space-y-1.5 md:col-span-2"><Label>文章封面</Label><ArticleImageField initialAsset={article.coverAsset ? toMediaAssetOption(article.coverAsset) : null} legacyUrl={article.coverImage} serviceConfigured={blobConfigured} /></div></div>
          {!article.category.isActive ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">当前栏目已停用，前台不会显示；发布前请启用栏目或重新归类。</p> : null}
          <label className="mt-4 flex items-center gap-2 text-sm text-[#475467]"><input type="checkbox" name="featured" defaultChecked={article.featured} className="size-4 rounded border-[#D0D5DD]" />推荐文章</label>
          {!sourceValidation.ok ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">英文源仍缺少：{sourceValidation.missingFields.join("、")}</p> : null}
          <div className="mt-5 flex justify-end"><Button type="submit" className="bg-[#172033] text-white hover:bg-[#27334a]">保存基础设置</Button></div>
        </form>

        <aside className="admin-card p-5">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Bot className="size-4" /></span><div><h2 className="text-sm font-semibold text-[#172033]">AI 生成八语言</h2><p className="mt-1 text-xs leading-5 text-[#667085]">{provider.configured ? `${provider.providerLabel} · ${provider.model}` : provider.error}</p></div></div>
          <form action={createArticleTranslationJobAction} className="mt-4"><input type="hidden" name="articleId" value={article.id} /><div className="grid grid-cols-2 gap-2">{articleTranslationLocales.filter((locale) => locale !== Locale.EN).map((locale) => { const status = localeStatus(locale); return <label key={locale} className="flex items-center gap-2 rounded-lg border border-[#EAECF0] px-3 py-2 text-xs text-[#475467]"><input type="checkbox" name="targetLocales" value={locale} defaultChecked={status !== TranslationStatus.PUBLISHED} disabled={status === TranslationStatus.PUBLISHED} /><span>{localeMeta[locale][0]} {localeMeta[locale][2]}</span></label>; })}</div><Button type="submit" disabled={!provider.configured || !sourceValidation.ok} className="mt-4 w-full bg-violet-700 text-white hover:bg-violet-800"><Bot className="size-4" />创建翻译任务</Button><p className="mt-2 text-[11px] leading-5 text-[#98A2B3]">已发布语言不会被覆盖。AI 结果保存为“待审核”，不会自动公开。</p></form>
        </aside>
      </section>

      <section className="mt-5 admin-card overflow-hidden">
        <div className="border-b border-[#E4E7EC] px-5 pt-5"><div className="flex items-start gap-3"><Languages className="mt-0.5 size-4 text-[#667085]" /><div><h2 className="text-sm font-semibold text-[#172033]">九语言内容与 SEO</h2><p className="mt-1 text-xs text-[#667085]">语言回退仅用于公开浏览；后台始终显示真实缺失状态。</p></div></div><nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="文章语言">{articleTranslationLocales.map((locale) => { const active = locale === selectedLocale; const status = localeStatus(locale); return <Link key={locale} href={`/admin/articles/${article.id}?locale=${locale}`} className={`min-w-24 border-b-2 px-3 py-3 text-center text-xs font-medium ${active ? "border-[#172033] text-[#172033]" : "border-transparent text-[#667085] hover:text-[#344054]"}`}><span className="block text-base">{localeMeta[locale][0]}</span><span className="mt-1 block">{localeMeta[locale][1]}</span><span className={`mt-1 block text-[10px] ${status === TranslationStatus.PUBLISHED ? "text-emerald-700" : status === TranslationStatus.MISSING ? "text-rose-600" : "text-amber-700"}`}>{statusLabel[status]}</span></Link>; })}</nav></div>
        <form action={saveArticleTranslationAction} className="p-5"><input type="hidden" name="articleId" value={article.id} /><input type="hidden" name="locale" value={selectedLocale} /><div className="flex flex-col gap-3 border-b border-[#EAECF0] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[#172033]">{localeMeta[selectedLocale][0]} {localeMeta[selectedLocale][1]}</p><p className="mt-1 text-xs text-[#98A2B3]">{selected ? `最后更新 ${selected.updatedAt.toLocaleString("zh-CN")}` : "该语言内容尚未创建"}</p></div><div className="w-full space-y-1.5 sm:w-48"><Label htmlFor="translationStatus">内容状态</Label><select id="translationStatus" name="status" defaultValue={selected?.status ?? TranslationStatus.NEEDS_REVIEW} className="admin-select h-10 w-full px-3"><option value="NEEDS_REVIEW">待审核</option><option value="MACHINE_DRAFT">机器草稿</option><option value="PUBLISHED">已发布</option></select></div></div><div className="mt-5"><ArticleSeoFields initialTitle={selected?.title} initialExcerpt={selected?.excerpt} initialSeoTitle={selected?.seoTitle} initialSeoDescription={selected?.seoDescription} locale={selectedLocale} /></div><div className="mt-7 border-t border-[#EAECF0] pt-6"><div className="mb-4"><h3 className="text-sm font-semibold text-[#172033]">结构化正文</h3><p className="mt-1 text-xs text-[#667085]">按内容块编辑和排序，图片可直接上传或从媒体中心复用。</p></div><ArticleContentEditor key={`${article.id}-${selectedLocale}-${selected?.updatedAt.toISOString() || "new"}`} initialContent={selected?.content} locale={selectedLocale} serviceConfigured={blobConfigured} /></div><div className="mt-5 flex justify-end"><Button type="submit" className="bg-[#172033] text-white hover:bg-[#27334a]">保存 {localeMeta[selectedLocale][2]} 内容</Button></div></form>
      </section>

      <section className="mt-5 admin-card p-5"><h2 className="text-sm font-semibold text-[#172033]">最近翻译任务</h2>{article.translationJobs.length ? <div className="mt-4 divide-y divide-[#EAECF0]">{article.translationJobs.map((job) => <article key={job.id} className="grid gap-3 py-3 text-xs md:grid-cols-[1fr_130px_100px_1.2fr] md:items-center"><div><p className="font-medium text-[#344054]">{job.provider}</p><p className="mt-0.5 font-mono text-[10px] text-[#98A2B3]">{job.model}</p></div><Badge variant="outline" className="w-fit border-[#D0D5DD] bg-white text-[#667085]">{jobStatusLabel[job.status] ?? job.status}</Badge><p className="text-[#667085]">{job.completedItems}/{job.totalItems} 完成</p><p className="truncate text-rose-600">{job.lastError || "无错误"}</p></article>)}</div> : <p className="mt-3 text-xs text-[#98A2B3]">尚未创建文章翻译任务。</p>}</section>
    </main>
  );
}

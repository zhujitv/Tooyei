"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ArticleKind, ContentStatus, Locale, Prisma, TranslationStatus } from "@/generated/prisma/client";
import { articleContentFromEditor, articleReadingMinutes, parseArticleContentJson } from "@/lib/article-content";
import { normalizeArticleCoverImage } from "@/lib/article-cover";
import { articleSlugPattern, validateArticleSource } from "@/lib/article-publication";
import { requireProductManagerSession, requireTranslationManagerSession } from "@/lib/admin-auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  refreshRemovedArticleAssets,
  resolveArticleContentAssets,
  resolveArticleCoverAsset,
  syncArticleContentAssetReferences,
} from "@/lib/repositories/article-assets";
import {
  articleTranslationLocales,
  createArticleTranslationJob,
} from "@/lib/repositories/article-translation-jobs";
import { contentLocales, localizedPath } from "@/lib/site";
import { productTranslationProviderId } from "@/lib/translation-providers/types";

const optionalText = z.string().trim().max(5000).optional().transform((value) => value || null);
const articleCoreSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().trim().min(2).max(160).regex(articleSlugPattern, "Slug 只能使用小写字母、数字和连字符。"),
  kind: z.enum(ArticleKind),
  categoryId: z.string().trim().min(1, "请选择文章栏目。"),
  status: z.enum(ContentStatus),
  featured: z.boolean(),
  coverAssetId: z.string().trim().max(120).optional().transform((value) => value || null),
  coverImage: z.union([
    z.literal(""),
    z.url().max(2048).refine((value) => Boolean(normalizeArticleCoverImage(value)), "封面图片域名不受支持，请使用 Vercel Blob 或站内图片。"),
    z.string().regex(/^\/[A-Za-z0-9_./-]+$/),
  ]).transform((value) => value || null),
  authorName: optionalText,
});
const translationSchema = z.object({
  articleId: z.string().min(1),
  locale: z.enum(articleTranslationLocales),
  status: z.enum(TranslationStatus),
  title: z.string().trim().min(1).max(240),
  excerpt: z.string().trim().max(1200),
  contentText: z.string().max(100_000).optional().default(""),
  contentJson: z.string().max(250_000).optional(),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(500),
});

const requireDatabase = () => {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL 尚未配置，无法保存文章。");
};

const parseEditorContent = (value: { contentJson?: string; contentText: string }) =>
  value.contentJson?.trim() ? parseArticleContentJson(value.contentJson) : articleContentFromEditor(value.contentText);

const revalidateArticlePaths = (slug?: string) => {
  revalidatePath("/admin/content");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/article-categories");
  revalidatePath("/sitemap.xml");
  revalidatePath("/insights");
  revalidatePath("/insights/category/[slug]", "page");
  for (const locale of contentLocales) {
    revalidatePath(localizedPath(locale, "/insights"));
    revalidatePath(localizedPath(locale, "/insights/category/[slug]"), "page");
    if (slug) revalidatePath(localizedPath(locale, `/insights/${slug}`));
  }
  if (slug) revalidatePath(`/insights/${slug}`);
};

const errorRedirect = (path: string, error: unknown): never => {
  const message = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    ? "URL Slug 已存在，请更换后重试。"
    : error instanceof Error ? error.message : "操作失败。";
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message.slice(0, 220))}`);
};

export async function createArticleAction(formData: FormData) {
  const session = await requireProductManagerSession();
  let destination = "/admin/articles";
  try {
    requireDatabase();
    const core = articleCoreSchema.safeParse({
      slug: formData.get("slug"), kind: formData.get("kind"), categoryId: formData.get("categoryId"), status: ContentStatus.DRAFT,
      featured: formData.get("featured") === "on", coverAssetId: formData.get("coverAssetId") || "",
      coverImage: formData.get("coverImage") || "", authorName: formData.get("authorName") || undefined,
    });
    const english = translationSchema.safeParse({
      articleId: "new", locale: Locale.EN, status: TranslationStatus.NEEDS_REVIEW,
      title: formData.get("title"), excerpt: formData.get("excerpt") || "", contentText: formData.get("contentText") || "",
      contentJson: formData.get("contentJson") || undefined,
      seoTitle: formData.get("seoTitle") || "", seoDescription: formData.get("seoDescription") || "",
    });
    if (!core.success) throw new Error(core.error.issues[0]?.message || "请检查文章基础信息。");
    if (!english.success) throw new Error(english.error.issues[0]?.message || "请检查英文文章内容。");
    const content = parseEditorContent(english.data);
    const validation = validateArticleSource({ ...english.data, content });
    if (!validation.ok) throw new Error(`英文内容缺少：${validation.missingFields.join("、")}`);
    const article = await getPrisma().$transaction(async (transaction) => {
      const [category, cover, resolvedContent] = await Promise.all([
        transaction.articleCategory.findUnique({ where: { id: core.data.categoryId }, select: { id: true } }),
        resolveArticleCoverAsset(transaction, core.data.coverAssetId, core.data.coverImage),
        resolveArticleContentAssets(transaction, content),
      ]);
      if (!category) throw new Error("选择的文章栏目不存在或已经删除。");
      const created = await transaction.article.create({
        data: {
          slug: core.data.slug, kind: core.data.kind, categoryId: category.id, status: ContentStatus.DRAFT,
          featured: core.data.featured, coverImage: cover.coverImage, coverAssetId: cover.coverAssetId, authorName: core.data.authorName,
          translations: { create: {
            locale: Locale.EN, status: TranslationStatus.NEEDS_REVIEW,
            title: english.data.title, excerpt: english.data.excerpt, content: resolvedContent,
            seoTitle: english.data.seoTitle, seoDescription: english.data.seoDescription,
            readingMinutes: articleReadingMinutes(resolvedContent),
          } },
        },
        select: { id: true, slug: true },
      });
      if (cover.coverAssetId) await transaction.mediaAsset.update({ where: { id: cover.coverAssetId }, data: { orphanedAt: null } });
      await syncArticleContentAssetReferences(transaction, created.id);
      return created;
    });
    await safeWriteAuditLog({ actorEmail: session.email, action: "article.created", entityType: "Article", entityId: article.id, metadata: { slug: article.slug } });
    revalidateArticlePaths(article.slug);
    destination = `/admin/articles/${article.id}?saved=created`;
  } catch (error) {
    errorRedirect("/admin/articles/new", error);
  }
  redirect(destination);
}

export async function saveArticleCoreAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const id = String(formData.get("id") || "");
  let destination = `/admin/articles/${id}`;
  try {
    requireDatabase();
    const parsed = articleCoreSchema.safeParse({
      id, slug: formData.get("slug"), kind: formData.get("kind"), categoryId: formData.get("categoryId"), status: formData.get("status"),
      featured: formData.get("featured") === "on", coverAssetId: formData.get("coverAssetId") || "",
      coverImage: formData.get("coverImage") || "", authorName: formData.get("authorName") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "请检查文章基础信息。");
    const { currentSlug, updated } = await getPrisma().$transaction(async (transaction) => {
      const [current, category] = await Promise.all([
        transaction.article.findUnique({ where: { id }, include: { translations: { where: { locale: Locale.EN } } } }),
        transaction.articleCategory.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true, isActive: true } }),
      ]);
      if (!current) throw new Error("文章不存在或已经删除。");
      if (!category) throw new Error("选择的文章栏目不存在或已经删除。");
      const cover = await resolveArticleCoverAsset(transaction, parsed.data.coverAssetId, parsed.data.coverImage);
      let english: (typeof current.translations)[number] | undefined = current.translations[0];
      if (english) {
        await transaction.$queryRaw`SELECT "id" FROM "ArticleTranslation" WHERE "id" = ${english.id} FOR SHARE`;
        english = await transaction.articleTranslation.findUnique({ where: { id: english.id } }) ?? undefined;
      }
      if (parsed.data.status === ContentStatus.PUBLISHED) {
        if (!category.isActive) throw new Error("当前文章栏目已停用，请先启用栏目或选择其他栏目后再发布。");
        const validation = validateArticleSource(english);
        if (!english || !validation.ok) throw new Error(`发布前请补全英文内容：${validation.missingFields.join("、") || "英文内容未创建"}`);
        if (english.status !== TranslationStatus.PUBLISHED) throw new Error("发布文章前，请先把英文版本设为“已发布”。");
        if (!english.publishedAt) await transaction.articleTranslation.update({ where: { id: english.id }, data: { publishedAt: new Date() } });
      }
      const next = await transaction.article.update({
        where: { id },
        data: {
          slug: parsed.data.slug, kind: parsed.data.kind, categoryId: category.id, status: parsed.data.status,
          featured: parsed.data.featured, coverImage: cover.coverImage, coverAssetId: cover.coverAssetId, authorName: parsed.data.authorName,
          publishedAt: parsed.data.status === ContentStatus.PUBLISHED ? current.publishedAt ?? new Date() : current.publishedAt,
        },
      });
      if (cover.coverAssetId) await transaction.mediaAsset.update({ where: { id: cover.coverAssetId }, data: { orphanedAt: null } });
      if (current.coverAssetId !== cover.coverAssetId) await refreshRemovedArticleAssets(transaction, [current.coverAssetId]);
      return { currentSlug: current.slug, updated: next };
    });
    await safeWriteAuditLog({ actorEmail: session.email, action: "article.updated", entityType: "Article", entityId: id, metadata: { slug: updated.slug, status: updated.status } });
    revalidateArticlePaths(currentSlug);
    revalidateArticlePaths(updated.slug);
    destination = `/admin/articles/${id}?saved=core`;
  } catch (error) {
    errorRedirect(`/admin/articles/${id}`, error);
  }
  redirect(destination);
}

export async function saveArticleTranslationAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const articleId = String(formData.get("articleId") || "");
  const locale = String(formData.get("locale") || "EN");
  let destination = `/admin/articles/${articleId}?locale=${encodeURIComponent(locale)}`;
  try {
    requireDatabase();
    const parsed = translationSchema.safeParse({
      articleId, locale, status: formData.get("status"), title: formData.get("title"), excerpt: formData.get("excerpt") || "",
      contentText: formData.get("contentText") || "", contentJson: formData.get("contentJson") || undefined,
      seoTitle: formData.get("seoTitle") || "", seoDescription: formData.get("seoDescription") || "",
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "请检查文章语言内容。");
    if (parsed.data.status === TranslationStatus.MISSING) throw new Error("已有内容不能保存为“缺失”，请使用待审核或已发布状态。");
    const content = parseEditorContent(parsed.data);
    const validation = validateArticleSource({ ...parsed.data, content });
    if (parsed.data.status === TranslationStatus.PUBLISHED && !validation.ok) {
      throw new Error(`发布前请补全：${validation.missingFields.join("、")}`);
    }
    const article = await getPrisma().$transaction(async (transaction) => {
      const [current, resolvedContent] = await Promise.all([
        transaction.article.findUnique({
          where: { id: articleId },
          select: { status: true, slug: true, translations: { where: { locale: parsed.data.locale }, select: { publishedAt: true } } },
        }),
        resolveArticleContentAssets(transaction, content),
      ]);
      if (!current) throw new Error("文章不存在或已经删除。");
      if (parsed.data.locale === Locale.EN && current.status === ContentStatus.PUBLISHED && parsed.data.status !== TranslationStatus.PUBLISHED) {
        throw new Error("文章整体已发布；如需撤下英文版本，请先将文章状态改为草稿或归档。");
      }
      const preservedPublishedAt = current.translations[0]?.publishedAt ?? (parsed.data.status === TranslationStatus.PUBLISHED ? new Date() : null);
      await transaction.articleTranslation.upsert({
        where: { articleId_locale: { articleId, locale: parsed.data.locale } },
        update: {
          title: parsed.data.title, excerpt: parsed.data.excerpt, content: resolvedContent,
          seoTitle: parsed.data.seoTitle, seoDescription: parsed.data.seoDescription,
          readingMinutes: articleReadingMinutes(resolvedContent), status: parsed.data.status, publishedAt: preservedPublishedAt,
        },
        create: {
          articleId, locale: parsed.data.locale, title: parsed.data.title, excerpt: parsed.data.excerpt, content: resolvedContent,
          seoTitle: parsed.data.seoTitle, seoDescription: parsed.data.seoDescription, status: parsed.data.status,
          readingMinutes: articleReadingMinutes(resolvedContent), publishedAt: parsed.data.status === TranslationStatus.PUBLISHED ? new Date() : null,
        },
      });
      await syncArticleContentAssetReferences(transaction, articleId);
      return current;
    });
    await safeWriteAuditLog({ actorEmail: session.email, action: "article.translation.saved", entityType: "Article", entityId: articleId, metadata: { locale: parsed.data.locale, status: parsed.data.status } });
    revalidateArticlePaths(article.slug);
    destination = `/admin/articles/${articleId}?locale=${parsed.data.locale}&saved=translation`;
  } catch (error) {
    errorRedirect(`/admin/articles/${articleId}?locale=${encodeURIComponent(locale)}`, error);
  }
  redirect(destination);
}

export async function createArticleTranslationJobAction(formData: FormData) {
  const session = await requireTranslationManagerSession();
  const articleId = String(formData.get("articleId") || "");
  let destination = `/admin/articles/${articleId}`;
  try {
    const parsed = z.object({
      articleId: z.string().min(1),
      targetLocales: z.array(z.enum(articleTranslationLocales)).min(1),
    }).safeParse({ articleId, targetLocales: formData.getAll("targetLocales") });
    if (!parsed.success) throw new Error("请至少选择一种目标语言。");
    const job = await createArticleTranslationJob({
      articleId: parsed.data.articleId,
      actorEmail: session.email,
      provider: productTranslationProviderId,
      targetLocales: parsed.data.targetLocales,
    });
    await safeWriteAuditLog({ actorEmail: session.email, action: "article.translation-job.created", entityType: "ArticleTranslationJob", entityId: job.id, metadata: { articleId, totalItems: job.totalItems } });
    revalidatePath("/admin/articles");
    destination = `/admin/articles/${articleId}?saved=translation-job`;
  } catch (error) {
    errorRedirect(`/admin/articles/${articleId}`, error);
  }
  redirect(destination);
}

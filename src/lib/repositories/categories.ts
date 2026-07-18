import "server-only";

import {
  ContentStatus,
  Locale as DatabaseLocale,
  MediaKind,
  ProductKind,
  TranslationStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { products as sampleProducts } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { contentLocales, type ContentLocale, type Locale } from "@/lib/site";
import { withDataFallback } from "@/lib/server-data";

const localeMap: Record<Locale, DatabaseLocale> = {
  en: DatabaseLocale.EN,
  de: DatabaseLocale.DE,
  fr: DatabaseLocale.FR,
  es: DatabaseLocale.ES,
  ru: DatabaseLocale.RU,
  ja: DatabaseLocale.JA,
  it: DatabaseLocale.IT,
  ar: DatabaseLocale.AR,
  zh: DatabaseLocale.ZH,
};

const localeFromDatabase: Partial<Record<DatabaseLocale, ContentLocale>> = {
  [DatabaseLocale.ZH]: "zh",
  [DatabaseLocale.EN]: "en",
  [DatabaseLocale.ES]: "es",
  [DatabaseLocale.DE]: "de",
  [DatabaseLocale.FR]: "fr",
  [DatabaseLocale.RU]: "ru",
  [DatabaseLocale.JA]: "ja",
  [DatabaseLocale.IT]: "it",
  [DatabaseLocale.AR]: "ar",
};

const publicCategoryWhere: Prisma.CategoryWhereInput = {
  isActive: true,
  status: { not: ContentStatus.ARCHIVED },
  OR: [
    { parentId: null },
    { parent: { is: { isActive: true, status: { not: ContentStatus.ARCHIVED } } } },
  ],
};

export type CategoryTranslationFields = {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type PublicCategoryNode = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  coverImage: string | null;
  sortOrder: number;
  children: PublicCategoryNode[];
  parent?: { slug: string; name: string } | null;
};

export type AdminCategoryNode = {
  id: string;
  parentId: string | null;
  slug: string;
  kind: ProductKind;
  isActive: boolean;
  coverImage: string;
  coverAsset: MediaAssetOption | null;
  sortOrder: number;
  productCount: number;
  childCount: number;
  translations: Record<ContentLocale, CategoryTranslationFields>;
  translationComplete: Record<ContentLocale, boolean>;
  createdAt: string | null;
  updatedAt: string | null;
  children: AdminCategoryNode[];
};

export type CategoryMutationInput = {
  parentId: string | null;
  slug: string;
  kind: ProductKind;
  isActive: boolean;
  coverImage?: string | null;
  coverAssetId?: string | null;
  sortOrder: number;
  translations: Record<ContentLocale, CategoryTranslationFields>;
};

type TranslationRecord = {
  locale: DatabaseLocale;
  name: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const emptyTranslation = (): CategoryTranslationFields => ({
  name: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
});

const adminTranslations = (translations: TranslationRecord[]) => {
  const result = Object.fromEntries(contentLocales.map((locale) => [locale, emptyTranslation()])) as Record<
    ContentLocale,
    CategoryTranslationFields
  >;

  for (const translation of translations) {
    const locale = localeFromDatabase[translation.locale];
    if (!locale) continue;
    result[locale] = {
      name: translation.name,
      description: translation.description ?? "",
      seoTitle: translation.seoTitle ?? "",
      seoDescription: translation.seoDescription ?? "",
    };
  }

  return result;
};

const localizedTranslation = (translations: TranslationRecord[], locale: Locale, slug: string) => {
  const byLocale = new Map(translations.map((translation) => [translation.locale, translation]));
  const candidates = [
    byLocale.get(localeMap[locale]),
    byLocale.get(DatabaseLocale.EN),
    byLocale.get(DatabaseLocale.ZH),
  ].filter((translation): translation is TranslationRecord => Boolean(translation));
  const firstValue = (field: keyof Pick<TranslationRecord, "name" | "description" | "seoTitle" | "seoDescription">) =>
    candidates.map((translation) => translation[field]?.trim()).find(Boolean) ?? "";
  const name = firstValue("name") || slug;
  const description = firstValue("description");

  return {
    name,
    description,
    seoTitle: firstValue("seoTitle") || name,
    seoDescription: firstValue("seoDescription") || description,
  };
};

const fallbackName = (kind: string, locale: Locale) => {
  if (locale === "zh") return `${kind} 地板`;
  if (locale === "es") return `Suelos ${kind}`;
  if (locale === "de") return `${kind}-Bodenbeläge`;
  if (locale === "fr") return `Revêtement de sol ${kind}`;
  if (locale === "ru") return `Напольное покрытие ${kind}`;
  if (locale === "ja") return `${kind} フローリング`;
  if (locale === "it") return `Pavimento ${kind}`;
  if (locale === "ar") return `أرضيات ${kind}`;
  return `${kind} Flooring`;
};

const samplePublicCategories = (locale: Locale): PublicCategoryNode[] =>
  Array.from(new Set(sampleProducts.map((product) => product.category))).map((kind, index) => ({
    id: kind.toLowerCase(),
    parentId: null,
    slug: kind.toLowerCase().replaceAll("_", "-"),
    name: fallbackName(kind, locale),
    description: "",
    seoTitle: fallbackName(kind, locale),
    seoDescription: "",
    coverImage: sampleProducts.find((product) => product.category === kind)?.image ?? null,
    sortOrder: index,
    children: [],
    parent: null,
  }));

const buildPublicTree = <T extends { id: string; parentId: string | null; sortOrder: number }>(
  records: T[],
  mapRecord: (record: T) => PublicCategoryNode,
) => {
  const nodes = new Map(records.map((record) => [record.id, mapRecord(record)]));
  const roots: PublicCategoryNode[] = [];

  for (const record of records) {
    const node = nodes.get(record.id);
    if (!node) continue;
    const parent = record.parentId ? nodes.get(record.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sort = (items: PublicCategoryNode[]) => {
    items.sort((left, right) => left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
};

export async function getPublicCategoryTree(locale: Locale): Promise<PublicCategoryNode[]> {
  if (!isDatabaseConfigured()) return samplePublicCategories(locale);

  const records = await withDataFallback("categories.public.tree", () => getPrisma().category.findMany({
    where: publicCategoryWhere,
    include: { translations: true, coverAsset: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), () => [], { locale });

  return buildPublicTree(records, (record) => ({
    id: record.id,
    parentId: record.parentId,
    slug: record.slug,
    ...localizedTranslation(record.translations, locale, record.slug),
    coverImage: record.coverAsset?.url ?? record.coverImage,
    sortOrder: record.sortOrder,
    children: [],
  }));
}

export async function getPublicCategoryBySlug(slug: string, locale: Locale): Promise<PublicCategoryNode | undefined> {
  if (!isDatabaseConfigured()) return samplePublicCategories(locale).find((category) => category.slug === slug);

  const record = await withDataFallback("categories.public.detail", () => getPrisma().category.findFirst({
    where: { slug, ...publicCategoryWhere },
    include: {
      translations: true,
      coverAsset: true,
      parent: { include: { translations: true } },
      children: {
        where: { isActive: true, status: { not: ContentStatus.ARCHIVED } },
        include: { translations: true, coverAsset: true },
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      },
    },
  }), null, { locale, slug });
  if (!record) return undefined;

  return {
    id: record.id,
    parentId: record.parentId,
    slug: record.slug,
    ...localizedTranslation(record.translations, locale, record.slug),
    coverImage: record.coverAsset?.url ?? record.coverImage,
    sortOrder: record.sortOrder,
    parent: record.parent
      ? { slug: record.parent.slug, name: localizedTranslation(record.parent.translations, locale, record.parent.slug).name }
      : null,
    children: record.children.map((child) => ({
      id: child.id,
      parentId: child.parentId,
      slug: child.slug,
      ...localizedTranslation(child.translations, locale, child.slug),
      coverImage: child.coverAsset?.url ?? child.coverImage,
      sortOrder: child.sortOrder,
      children: [],
    })),
  };
}

export async function getPublicCategorySlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return samplePublicCategories("zh").map(({ slug }) => slug);
  const records = await withDataFallback("categories.public.slugs", () => getPrisma().category.findMany({
    where: publicCategoryWhere,
    select: { slug: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), () => samplePublicCategories("zh").map(({ slug }) => ({ slug })));
  return records.map(({ slug }) => slug);
}

type AdminCategoryRecord = Prisma.CategoryGetPayload<{
  include: {
    translations: true;
    coverAsset: true;
    _count: { select: { children: true; products: true; productAssignments: true } };
  };
}>;

const buildAdminTree = (records: AdminCategoryRecord[]) => {
  const nodes = new Map<string, AdminCategoryNode>();
  for (const record of records) {
    const translations = adminTranslations(record.translations);
    nodes.set(record.id, {
      id: record.id,
      parentId: record.parentId,
      slug: record.slug,
      kind: record.kind,
      isActive: record.isActive,
      coverImage: record.coverAsset?.url ?? record.coverImage ?? "",
      coverAsset: record.coverAsset ? {
        id: record.coverAsset.id,
        url: record.coverAsset.url,
        pathname: record.coverAsset.pathname,
        filename: record.coverAsset.originalFilename || record.coverAsset.pathname.split("/").pop() || "未命名资源",
        mimeType: record.coverAsset.mimeType,
        sizeBytes: record.coverAsset.sizeBytes,
        width: record.coverAsset.width,
        height: record.coverAsset.height,
        assetType: record.coverAsset.assetType,
        storageProvider: record.coverAsset.storageProvider,
        uploadedAt: record.coverAsset.uploadedAt?.toISOString() ?? null,
        createdAt: record.coverAsset.createdAt.toISOString(),
        orphaned: false,
        referenceCount: 1,
        references: [],
      } : null,
      sortOrder: record.sortOrder,
      productCount: Math.max(record._count.products, record._count.productAssignments),
      childCount: record._count.children,
      translations,
      translationComplete: Object.fromEntries(
        contentLocales.map((locale) => [locale, Boolean(translations[locale].name.trim())]),
      ) as Record<ContentLocale, boolean>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      children: [],
    });
  }

  const roots: AdminCategoryNode[] = [];
  for (const record of records) {
    const node = nodes.get(record.id);
    if (!node) continue;
    const parent = record.parentId ? nodes.get(record.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (items: AdminCategoryNode[]) => {
    items.sort((left, right) => left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
};

export async function getAdminCategoryTree(): Promise<AdminCategoryNode[]> {
  if (!isDatabaseConfigured()) {
    return samplePublicCategories("zh").map((category) => ({
      id: category.id,
      parentId: null,
      slug: category.slug,
      kind: ProductKind[category.slug.toUpperCase() as keyof typeof ProductKind] ?? ProductKind.SPC,
      isActive: true,
      coverImage: category.coverImage ?? "",
      coverAsset: null,
      sortOrder: category.sortOrder,
      productCount: sampleProducts.filter((product) => product.category.toLowerCase() === category.slug).length,
      childCount: 0,
      translations: Object.fromEntries(
        contentLocales.map((locale) => [locale, { ...emptyTranslation(), name: fallbackName(category.slug.toUpperCase(), locale) }]),
      ) as Record<ContentLocale, CategoryTranslationFields>,
      translationComplete: Object.fromEntries(contentLocales.map((locale) => [locale, true])) as Record<ContentLocale, boolean>,
      createdAt: null,
      updatedAt: null,
      children: [],
    }));
  }

  const records = await withDataFallback<AdminCategoryRecord[]>("categories.admin.tree", () => getPrisma().category.findMany({
    include: {
      translations: true,
      coverAsset: true,
      _count: { select: { children: true, products: true, productAssignments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), []);
  return buildAdminTree(records);
}

const requireDatabase = () => {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法修改产品栏目。");
};

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

const assertRequiredTranslations = (input: CategoryMutationInput) => {
  if (!input.translations.zh.name.trim()) throw new Error("中文栏目名称为必填项。");
  if (!input.translations.en.name.trim()) throw new Error("英文栏目名称为必填项。");
};

async function assertParent(parentId: string | null, categoryId?: string) {
  if (!parentId) return null;
  if (categoryId && parentId === categoryId) throw new Error("栏目不能将自己设置为父栏目。");

  const parent = await getPrisma().category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true, kind: true },
  });
  if (!parent) throw new Error("选择的父级栏目不存在。");
  if (parent.parentId) throw new Error("产品栏目当前仅支持一级和二级，不能创建第三级栏目。");
  return parent;
}

const translationWrites = (input: CategoryMutationInput) =>
  contentLocales
    .map((locale) => ({ locale, values: input.translations[locale] }))
    .filter(({ values }) => values.name.trim())
    .map(({ locale, values }) => ({
      locale: localeMap[locale],
      name: values.name.trim(),
      description: values.description.trim() || null,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
      status: TranslationStatus.PUBLISHED,
      publishedAt: new Date(),
    }));

const requireCoverAsset = async (tx: Prisma.TransactionClient, assetId: string) => {
  await tx.$queryRaw`SELECT "id" FROM "MediaAsset" WHERE "id" = ${assetId} FOR UPDATE`;
  const asset = await tx.mediaAsset.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw new Error("选择的栏目封面资源不存在、已删除或不可用。");
  if (asset.kind !== MediaKind.IMAGE || !asset.mimeType.startsWith("image/")) {
    throw new Error("栏目封面只能关联图片资源。");
  }
  return asset;
};

export async function createCategory(input: CategoryMutationInput) {
  requireDatabase();
  assertRequiredTranslations(input);
  const slug = normalizeSlug(input.slug);
  const parent = await assertParent(input.parentId);
  const existing = await getPrisma().category.findUnique({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("该栏目 Slug 已存在，请使用其他 Slug。");
  const conflictingProduct = await getPrisma().product.findUnique({ where: { slug }, select: { id: true } });
  if (conflictingProduct) throw new Error("该 Slug 已被产品使用，请使用其他 Slug，避免前台链接冲突。");

  return getPrisma().$transaction(async (tx) => {
    if (!input.coverAssetId && input.coverImage?.trim()) {
      throw new Error("新栏目封面必须从媒体中心选择或上传。");
    }
    const coverAsset = input.coverAssetId ? await requireCoverAsset(tx, input.coverAssetId) : null;
    const category = await tx.category.create({
      data: {
        parentId: parent?.id ?? null,
        slug,
        kind: parent?.kind ?? input.kind,
        status: input.isActive ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
        isActive: input.isActive,
        coverImage: coverAsset?.url ?? null,
        coverAssetId: coverAsset?.id ?? null,
        sortOrder: input.sortOrder,
        translations: { create: translationWrites(input) },
      },
      select: { id: true, slug: true },
    });
    if (coverAsset) await tx.mediaAsset.update({ where: { id: coverAsset.id }, data: { orphanedAt: null } });
    return category;
  });
}

export async function updateCategory(categoryId: string, input: CategoryMutationInput) {
  requireDatabase();
  assertRequiredTranslations(input);
  const prisma = getPrisma();
  const current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, coverImage: true, children: { select: { id: true }, take: 1 } },
  });
  if (!current) throw new Error("栏目不存在或已被删除。");

  const parent = await assertParent(input.parentId, categoryId);
  if (parent && current.children.length) {
    throw new Error("当前栏目存在下级栏目，不能再移动到其他父栏目下。");
  }

  const slug = normalizeSlug(input.slug);
  const duplicate = await prisma.category.findFirst({
    where: { slug, id: { not: categoryId } },
    select: { id: true },
  });
  if (duplicate) throw new Error("该栏目 Slug 已存在，请使用其他 Slug。");
  const conflictingProduct = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (conflictingProduct) throw new Error("该 Slug 已被产品使用，请使用其他 Slug，避免前台链接冲突。");

  const writes = translationWrites(input);
  return prisma.$transaction(async (tx) => {
    if (!input.coverAssetId && input.coverImage?.trim() && input.coverImage.trim() !== current.coverImage) {
      throw new Error("栏目封面必须从媒体中心选择或上传；历史地址只能原样保留。");
    }
    const coverAsset = input.coverAssetId ? await requireCoverAsset(tx, input.coverAssetId) : null;
    const coverImage = coverAsset?.url ?? (input.coverImage?.trim() || null);
    await tx.category.update({
      where: { id: categoryId },
      data: {
        parentId: parent?.id ?? null,
        slug,
        kind: parent?.kind ?? input.kind,
        status: input.isActive ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
        isActive: input.isActive,
        coverImage,
        coverAssetId: coverAsset?.id ?? null,
        sortOrder: input.sortOrder,
      },
    });

    for (const locale of contentLocales) {
      const values = writes.find((translation) => translation.locale === localeMap[locale]);
      if (values) {
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId, locale: localeMap[locale] } },
          update: values,
          create: { categoryId, ...values },
        });
      } else if (locale === "es" || locale === "de") {
        await tx.categoryTranslation.deleteMany({ where: { categoryId, locale: localeMap[locale] } });
      }
    }

    if (coverAsset) await tx.mediaAsset.update({ where: { id: coverAsset.id }, data: { orphanedAt: null } });

    return { id: categoryId, slug };
  });
}

export async function setCategoryActive(categoryId: string, isActive: boolean) {
  requireDatabase();
  const current = await getPrisma().category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!current) throw new Error("栏目不存在或已被删除。");
  return getPrisma().category.update({
    where: { id: categoryId },
    data: { isActive, status: isActive ? ContentStatus.PUBLISHED : ContentStatus.DRAFT },
    select: { id: true, isActive: true },
  });
}

export async function deleteCategory(categoryId: string) {
  requireDatabase();
  const category = await getPrisma().category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      _count: { select: { children: true, products: true, productAssignments: true } },
    },
  });
  if (!category) throw new Error("栏目不存在或已被删除。");
  if (category._count.children) {
    throw new Error(`该栏目还有 ${category._count.children} 个下级栏目，请先迁移或删除下级栏目。`);
  }
  const productCount = Math.max(category._count.products, category._count.productAssignments);
  if (productCount) {
    throw new Error(`该栏目已关联 ${productCount} 个产品，请先将产品迁移到其他栏目。`);
  }
  await getPrisma().category.delete({ where: { id: categoryId } });
  return { id: categoryId };
}

export async function reorderCategories(parentId: string | null, orderedIds: string[]) {
  requireDatabase();
  if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
    throw new Error("排序数据无效。");
  }
  const records = await getPrisma().category.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, parentId: true },
  });
  if (records.length !== orderedIds.length || records.some((record) => record.parentId !== parentId)) {
    throw new Error("只能在同一层级内调整栏目顺序。");
  }
  const prisma = getPrisma();
  await prisma.$transaction(
    orderedIds.map((id, sortOrder) => prisma.category.update({ where: { id }, data: { sortOrder } })),
  );
  return { parentId, orderedIds };
}

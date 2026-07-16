import {
  ContentStatus,
  Locale as DatabaseLocale,
  ProductKind,
  Prisma,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";

export type AdminProductSummary = {
  slug: string;
  sku: string;
  category: string;
  categoryId: string | null;
  kind: ProductKind;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  title: string;
  updatedAt: Date | null;
  translationStates: Record<Locale, TranslationStatus>;
  publishedTranslations: number;
  missingTranslations: number;
};

export type AdminProductTranslation = {
  locale: Locale;
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  status: TranslationStatus;
};

export type AdminEditableProduct = {
  slug: string;
  sku: string;
  category: string;
  categoryId: string | null;
  kind: ProductKind;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  updatedAt: Date | null;
  translations: AdminProductTranslation[];
};

export type AdminProductCategoryOption = {
  id: string;
  slug: string;
  kind: ProductKind;
  label: string;
};

export type AdminProductFilters = {
  q?: string;
  status?: ContentStatus;
  kind?: ProductKind;
};

export type AdminProductStats = {
  total: number;
  published: number;
  draft: number;
  archived: number;
  featured: number;
  needsReview: number;
  missing: number;
};

export type UpdateProductCoreInput = {
  slug: string;
  sku: string;
  categoryId: string;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
};

export type UpdateProductTranslationInput = {
  slug: string;
  locale: Locale;
  title: string;
  summary: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: TranslationStatus;
};

const localeMap: Record<Locale, DatabaseLocale> = {
  zh: DatabaseLocale.ZH,
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
};

const sampleDate = new Date(0);

const sampleEditableProduct = (slug: string): AdminEditableProduct | undefined => {
  const product = sampleProducts.find((candidate) => candidate.slug === slug);
  if (!product) return undefined;
  return {
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    categoryId: null,
    kind: ProductKind[product.category as keyof typeof ProductKind] ?? ProductKind.SPC,
    status: ContentStatus.PUBLISHED,
    featured: true,
    sortOrder: 0,
    updatedAt: sampleDate,
    translations: locales.map((locale) => ({
      locale,
      title: product.title[locale],
      summary: product.summary[locale],
      seoTitle: product.title[locale],
      seoDescription: product.summary[locale],
      status: TranslationStatus.PUBLISHED,
    })),
  };
};

const sampleSummaries = (): AdminProductSummary[] =>
  sampleProducts.map((product, index) => ({
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    categoryId: null,
    kind: ProductKind[product.category as keyof typeof ProductKind] ?? ProductKind.SPC,
    status: ContentStatus.PUBLISHED,
    featured: true,
    sortOrder: index,
    updatedAt: sampleDate,
    title: product.title.zh,
    translationStates: {
      zh: TranslationStatus.PUBLISHED,
      en: TranslationStatus.PUBLISHED,
      es: TranslationStatus.PUBLISHED,
      de: TranslationStatus.PUBLISHED,
    },
    publishedTranslations: locales.length,
    missingTranslations: 0,
  }));

const categoryLabel = (category?: {
  kind: ProductKind;
  slug: string;
  translations?: Array<{ locale: DatabaseLocale; name: string }>;
}) =>
  category?.translations?.find((translation) => translation.locale === DatabaseLocale.ZH)?.name ??
  category?.slug ??
  category?.kind ??
  "—";

const productInclude = {
  category: {
    include: {
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { name: true, locale: true },
      },
    },
  },
  translations: true,
} satisfies Prisma.ProductInclude;

type AdminProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const translationFor = (product: AdminProductRecord, locale: Locale) =>
  product.translations.find((translation) => translation.locale === localeMap[locale]);

const toSummary = (product: AdminProductRecord): AdminProductSummary => {
  const states = Object.fromEntries(
    locales.map((locale) => [locale, translationFor(product, locale)?.status ?? TranslationStatus.MISSING]),
  ) as Record<Locale, TranslationStatus>;

  return {
    slug: product.slug,
    sku: product.sku,
    category: categoryLabel(product.category),
    categoryId: product.categoryId,
    kind: product.kind,
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    updatedAt: product.updatedAt,
    title: translationFor(product, "zh")?.title ?? translationFor(product, "en")?.title ?? product.sku,
    translationStates: states,
    publishedTranslations: locales.filter((locale) => states[locale] === TranslationStatus.PUBLISHED).length,
    missingTranslations: locales.filter((locale) => states[locale] === TranslationStatus.MISSING).length,
  };
};

const searchCondition = (query: string): Prisma.ProductWhereInput => {
  const contains = { contains: query, mode: "insensitive" as const };
  return {
    OR: [
      { slug: contains },
      { sku: contains },
      { translations: { some: { OR: [{ title: contains }, { summary: contains }, { seoTitle: contains }, { seoDescription: contains }] } } },
      { category: { is: { OR: [{ slug: contains }, { translations: { some: { name: contains } } }] } } },
    ],
  };
};

const buildWhere = (filters: AdminProductFilters = {}): Prisma.ProductWhereInput => {
  const clauses: Prisma.ProductWhereInput[] = [];
  const query = filters.q?.trim();

  if (filters.status) clauses.push({ status: filters.status });
  if (filters.kind) clauses.push({ kind: filters.kind });
  if (query) clauses.push(searchCondition(query));

  return clauses.length ? { AND: clauses } : {};
};

const applySampleFilters = (products: AdminProductSummary[], filters: AdminProductFilters = {}) => {
  const query = filters.q?.trim().toLowerCase();
  return products.filter((product) => {
    if (filters.status && product.status !== filters.status) return false;
    if (filters.kind && product.kind !== filters.kind) return false;
    if (!query) return true;
    return [product.title, product.sku, product.slug, product.category]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });
};

const statsFromProducts = (products: AdminProductSummary[]): AdminProductStats => ({
  total: products.length,
  published: products.filter((product) => product.status === ContentStatus.PUBLISHED).length,
  draft: products.filter((product) => product.status === ContentStatus.DRAFT).length,
  archived: products.filter((product) => product.status === ContentStatus.ARCHIVED).length,
  featured: products.filter((product) => product.featured).length,
  needsReview: products.filter((product) =>
    locales.some((locale) => product.translationStates[locale] === TranslationStatus.NEEDS_REVIEW),
  ).length,
  missing: products.filter((product) =>
    locales.some((locale) => product.translationStates[locale] === TranslationStatus.MISSING),
  ).length,
});

export async function getAdminProducts(filters: AdminProductFilters = {}): Promise<AdminProductSummary[]> {
  if (!isDatabaseConfigured()) {
    return applySampleFilters(sampleSummaries(), filters);
  }

  const records = await getPrisma().product.findMany({
    where: buildWhere(filters),
    include: productInclude,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return records.map(toSummary);
}

export async function getAdminProduct(slug: string): Promise<AdminEditableProduct | undefined> {
  if (!isDatabaseConfigured()) return sampleEditableProduct(slug);

  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!product) return undefined;

  return {
    slug: product.slug,
    sku: product.sku,
    category: categoryLabel(product.category),
    categoryId: product.categoryId,
    kind: product.kind,
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    updatedAt: product.updatedAt,
    translations: locales.map((locale) => {
      const translation = product.translations.find(({ locale: value }) => value === localeMap[locale]);
      return {
        locale,
        title: translation?.title ?? "",
        summary: translation?.summary ?? "",
        seoTitle: translation?.seoTitle ?? "",
        seoDescription: translation?.seoDescription ?? "",
        status: translation?.status ?? TranslationStatus.MISSING,
      };
    }),
  };
}

export async function getAdminProductStats(): Promise<AdminProductStats> {
  if (!isDatabaseConfigured()) return statsFromProducts(sampleSummaries());

  const products = await getAdminProducts();
  return statsFromProducts(products);
}

export async function getAdminProductCategoryOptions(): Promise<AdminProductCategoryOption[]> {
  if (!isDatabaseConfigured()) {
    const categories = Array.from(new Set(sampleProducts.map((product) => product.category)));
    return categories.map((category) => ({
      id: category.toLowerCase(),
      slug: category.toLowerCase(),
      kind: ProductKind[category as keyof typeof ProductKind] ?? ProductKind.SPC,
      label: `${category} 地板`,
    }));
  }

  const categories = await getPrisma().category.findMany({
    where: { status: { not: ContentStatus.ARCHIVED } },
    include: {
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { locale: true, name: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    kind: category.kind,
    label: categoryLabel(category),
  }));
}

export async function updateProductCore(input: UpdateProductCoreInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be updated.");
  }

  const prisma = getPrisma();
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true, kind: true },
  });
  if (!category) throw new Error("Product category does not exist.");

  return prisma.product.update({
    where: { slug: input.slug },
    data: {
      sku: input.sku,
      categoryId: category.id,
      kind: category.kind,
      status: input.status,
      featured: input.featured,
      sortOrder: input.sortOrder,
    },
    select: {
      slug: true,
      sku: true,
      kind: true,
      status: true,
      featured: true,
      sortOrder: true,
      categoryId: true,
    },
  });
}

export async function updateProductTranslation(input: UpdateProductTranslationInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before product translations can be updated.");
  }

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!product) throw new Error("Product does not exist.");

  const locale = localeMap[input.locale];
  return prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale } },
    update: {
      title: input.title,
      summary: input.summary,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      status: input.status,
      publishedAt: input.status === TranslationStatus.PUBLISHED ? new Date() : null,
    },
    create: {
      productId: product.id,
      locale,
      title: input.title,
      summary: input.summary,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      status: input.status,
      publishedAt: input.status === TranslationStatus.PUBLISHED ? new Date() : null,
    },
  });
}

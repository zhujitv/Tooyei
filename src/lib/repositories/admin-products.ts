import {
  ContentStatus,
  Locale as DatabaseLocale,
  MediaKind,
  Prisma,
  ProductDownloadKind,
  ProductKind,
  ProductMediaRole,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts, readLocalizedText } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { contentLocales, type ContentLocale } from "@/lib/site";

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
  thumbnailUrl: string;
  thumbnailAlt: string;
  updatedAt: Date | null;
  translationStates: Record<ContentLocale, TranslationStatus>;
  publishedTranslations: number;
  missingTranslations: number;
  seoReadyTranslations: number;
  contentCounts: {
    media: number;
    features: number;
    specifications: number;
    applications: number;
    downloads: number;
  };
  completion: number;
};

export type AdminProductTranslation = {
  locale: ContentLocale;
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  status: TranslationStatus;
};

export type AdminProductMediaItem = {
  role: ProductMediaRole;
  kind: MediaKind;
  url: string;
  alt: string;
  caption: string;
  sortOrder: number;
  visible: boolean;
};

export type AdminProductFeatureItem = {
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  visible: boolean;
};

export type AdminProductSpecificationItem = {
  group: string;
  label: string;
  value: string;
  unit: string;
  sortOrder: number;
  visible: boolean;
};

export type AdminProductApplicationItem = {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  visible: boolean;
};

export type AdminProductDownloadItem = {
  kind: ProductDownloadKind;
  title: string;
  description: string;
  url: string;
  sortOrder: number;
  visible: boolean;
};

export type AdminEditableProduct = {
  slug: string;
  sku: string;
  category: string;
  categoryId: string | null;
  categoryIds: string[];
  kind: ProductKind;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  updatedAt: Date | null;
  translations: AdminProductTranslation[];
  media: AdminProductMediaItem[];
  features: AdminProductFeatureItem[];
  specifications: AdminProductSpecificationItem[];
  applications: AdminProductApplicationItem[];
  downloads: AdminProductDownloadItem[];
};

export type AdminProductCategoryOption = {
  id: string;
  parentId: string | null;
  slug: string;
  kind: ProductKind;
  label: string;
  depth: 0 | 1;
  isActive: boolean;
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

export type CreateProductInput = {
  slug: string;
  sku: string;
  categoryId: string;
  categoryIds?: string[];
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  title: string;
  summary: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type UpdateProductListSettingsInput = {
  slug: string;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
};

export type BatchProductOperation = "PUBLISH" | "DRAFT" | "ARCHIVE" | "FEATURE" | "UNFEATURE";

export type UpdateProductCoreInput = {
  slug: string;
  sku: string;
  categoryId: string;
  categoryIds: string[];
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
};

export type UpdateProductTranslationInput = {
  slug: string;
  locale: ContentLocale;
  title: string;
  summary: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: TranslationStatus;
};

export type UpdateProductStructuredContentInput = {
  slug: string;
  media: AdminProductMediaItem[];
  features: AdminProductFeatureItem[];
  specifications: AdminProductSpecificationItem[];
  applications: AdminProductApplicationItem[];
  downloads: AdminProductDownloadItem[];
};

export type AttachUploadedProductAssetInput = {
  slug: string;
  pathname: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  kind: "media" | "download";
  role?: ProductMediaRole;
  downloadKind?: ProductDownloadKind;
  title?: string;
  alt?: string;
  caption?: string;
};

const localeMap: Record<ContentLocale, DatabaseLocale> = {
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

const sampleDate = new Date(0);

const mediaMimeType = (url: string, kind: MediaKind) => {
  const pathname = url.split("?")[0]?.toLowerCase() ?? "";
  if (kind === MediaKind.VIDEO) return pathname.endsWith(".webm") ? "video/webm" : "video/mp4";
  if (kind === MediaKind.DOCUMENT) {
    if (pathname.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (pathname.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "application/pdf";
  }
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
};

const normalizePathname = (url: string) => url.trim();

const isAllowedAssetUrl = (url: string) => {
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const mediaKindForRole = (role: ProductMediaRole) => (role === ProductMediaRole.VIDEO ? MediaKind.VIDEO : MediaKind.IMAGE);

const sampleEditableProduct = (slug: string): AdminEditableProduct | undefined => {
  const product = sampleProducts.find((candidate) => candidate.slug === slug);
  if (!product) return undefined;
  return {
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    categoryId: null,
    categoryIds: [],
    kind: ProductKind[product.category as keyof typeof ProductKind] ?? ProductKind.SPC,
    status: ContentStatus.PUBLISHED,
    featured: true,
    sortOrder: 0,
    updatedAt: sampleDate,
    translations: contentLocales.map((locale) => ({
      locale,
      title: readLocalizedText(product.title, locale),
      summary: readLocalizedText(product.summary, locale),
      seoTitle: readLocalizedText(product.title, locale),
      seoDescription: readLocalizedText(product.summary, locale),
      status: product.title[locale] ? TranslationStatus.PUBLISHED : TranslationStatus.MISSING,
    })),
    media: [
      {
        role: ProductMediaRole.PRIMARY,
        kind: MediaKind.IMAGE,
        url: product.image,
        alt: product.title.zh,
        caption: "",
        sortOrder: 0,
        visible: true,
      },
    ],
    features: product.features.map((feature, sortOrder) => ({
      title: feature.zh,
      description: feature.description?.zh ?? "",
      icon: feature.icon ?? "",
      sortOrder,
      visible: true,
    })),
    specifications: product.specifications.map((specification, sortOrder) => ({
      group: specification.group ?? "",
      label: specification.label.zh,
      value: specification.value,
      unit: specification.unit ?? "",
      sortOrder,
      visible: true,
    })),
    applications: [],
    downloads: [],
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
    thumbnailUrl: product.image,
    thumbnailAlt: product.title.zh,
    translationStates: Object.fromEntries(
      contentLocales.map((locale) => [locale, product.title[locale] ? TranslationStatus.PUBLISHED : TranslationStatus.MISSING]),
    ) as Record<ContentLocale, TranslationStatus>,
    publishedTranslations: contentLocales.filter((locale) => Boolean(product.title[locale])).length,
    missingTranslations: contentLocales.filter((locale) => !product.title[locale]).length,
    seoReadyTranslations: contentLocales.filter((locale) => Boolean(product.title[locale])).length,
    contentCounts: {
      media: 1,
      features: product.features.length,
      specifications: product.specifications.length,
      applications: 0,
      downloads: 0,
    },
    completion: 90,
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

const listProductInclude = {
  category: {
    include: {
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { name: true, locale: true },
      },
    },
  },
  translations: true,
  primaryImage: {
    select: { url: true, alt: true },
  },
  _count: {
    select: {
      media: true,
      features: true,
      specifications: true,
      applications: true,
      downloads: true,
    },
  },
} satisfies Prisma.ProductInclude;

const editProductInclude = {
  ...listProductInclude,
  primaryImage: true,
  categoryAssignments: {
    orderBy: { sortOrder: "asc" as const },
    select: { categoryId: true },
  },
  media: {
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    include: { asset: true },
  },
  features: {
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
  specifications: {
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
  applications: {
    orderBy: { sortOrder: "asc" as const },
    include: { imageAsset: true, translations: true },
  },
  downloads: {
    orderBy: { sortOrder: "asc" as const },
    include: { asset: true, translations: true },
  },
} satisfies Prisma.ProductInclude;

type AdminProductRecord = Prisma.ProductGetPayload<{ include: typeof listProductInclude }>;
type AdminEditableProductRecord = Prisma.ProductGetPayload<{ include: typeof editProductInclude }>;

const translationFor = (product: AdminProductRecord, locale: ContentLocale) =>
  product.translations.find((translation) => translation.locale === localeMap[locale]);

const zhTranslation = <T extends { locale: DatabaseLocale }>(translations: T[]) =>
  translations.find((translation) => translation.locale === DatabaseLocale.ZH) ?? translations[0];

const toSummary = (product: AdminProductRecord): AdminProductSummary => {
  const states = Object.fromEntries(
    contentLocales.map((locale) => [locale, translationFor(product, locale)?.status ?? TranslationStatus.MISSING]),
  ) as Record<ContentLocale, TranslationStatus>;
  const seoReadyTranslations = contentLocales.filter((locale) => {
    const translation = translationFor(product, locale);
    return Boolean(translation?.seoTitle?.trim() && translation.seoDescription?.trim());
  }).length;
  const contentCounts = {
    media: product._count.media,
    features: product._count.features,
    specifications: product._count.specifications,
    applications: product._count.applications,
    downloads: product._count.downloads,
  };
  const publishedTranslations = contentLocales.filter((locale) => states[locale] === TranslationStatus.PUBLISHED).length;
  const completion = Math.min(
    100,
    15 +
      (product.primaryImage || contentCounts.media ? 20 : 0) +
      (contentCounts.features ? 10 : 0) +
      (contentCounts.specifications ? 15 : 0) +
      (contentCounts.applications ? 5 : 0) +
      (contentCounts.downloads ? 5 : 0) +
      Math.round((publishedTranslations / contentLocales.length) * 20) +
      Math.round((seoReadyTranslations / contentLocales.length) * 10),
  );

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
    thumbnailUrl: product.primaryImage?.url ?? "",
    thumbnailAlt: product.primaryImage?.alt ?? translationFor(product, "zh")?.title ?? product.sku,
    translationStates: states,
    publishedTranslations,
    missingTranslations: contentLocales.filter((locale) => states[locale] === TranslationStatus.MISSING).length,
    seoReadyTranslations,
    contentCounts,
    completion,
  };
};

const toEditableProduct = (product: AdminEditableProductRecord): AdminEditableProduct => {
  const media = product.media.map(({ asset, role, alt, caption, sortOrder, visible }) => ({
    role,
    kind: asset.kind,
    url: asset.url,
    alt: alt ?? asset.alt ?? "",
    caption: caption ?? "",
    sortOrder,
    visible,
  }));
  const hasPrimary = product.primaryImage && media.some((item) => item.url === product.primaryImage?.url);

  if (product.primaryImage && !hasPrimary) {
    media.unshift({
      role: ProductMediaRole.PRIMARY,
      kind: product.primaryImage.kind,
      url: product.primaryImage.url,
      alt: product.primaryImage.alt ?? "",
      caption: "",
      sortOrder: 0,
      visible: true,
    });
  }

  return {
    slug: product.slug,
    sku: product.sku,
    category: categoryLabel(product.category),
    categoryId: product.categoryId,
    categoryIds: product.categoryAssignments.map(({ categoryId }) => categoryId),
    kind: product.kind,
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    updatedAt: product.updatedAt,
    translations: contentLocales.map((locale) => {
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
    media,
    features: product.features.map(({ icon, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        title: translation?.value ?? "",
        description: translation?.description ?? "",
        icon: icon ?? "",
        sortOrder,
        visible,
      };
    }),
    specifications: product.specifications.map(({ group, sortOrder, translations, unit, value, visible }) => {
      const translation = zhTranslation(translations);
      return {
        group: group ?? "",
        label: translation?.label ?? "",
        value,
        unit: unit ?? "",
        sortOrder,
        visible,
      };
    }),
    applications: product.applications.map(({ imageAsset, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        title: translation?.title ?? "",
        description: translation?.description ?? "",
        imageUrl: imageAsset?.url ?? "",
        imageAlt: imageAsset?.alt ?? "",
        sortOrder,
        visible,
      };
    }),
    downloads: product.downloads.map(({ asset, kind, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        kind,
        title: translation?.title ?? "",
        description: translation?.description ?? "",
        url: asset.url,
        sortOrder,
        visible,
      };
    }),
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
    contentLocales.some((locale) => product.translationStates[locale] === TranslationStatus.NEEDS_REVIEW),
  ).length,
  missing: products.filter((product) =>
    contentLocales.some((locale) => product.translationStates[locale] === TranslationStatus.MISSING),
  ).length,
});

const uniqueByUrl = <T extends { url: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const url = item.url.trim();
    if (!isAllowedAssetUrl(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

const upsertAsset = async (
  prisma: Prisma.TransactionClient,
  input: { url: string; kind: MediaKind; alt?: string | null },
) => {
  const pathname = normalizePathname(input.url);
  return prisma.mediaAsset.upsert({
    where: { pathname },
    update: {
      kind: input.kind,
      url: input.url,
      alt: input.alt || null,
      mimeType: mediaMimeType(input.url, input.kind),
    },
    create: {
      kind: input.kind,
      pathname,
      url: input.url,
      alt: input.alt || null,
      mimeType: mediaMimeType(input.url, input.kind),
    },
  });
};

export async function getAdminProducts(filters: AdminProductFilters = {}): Promise<AdminProductSummary[]> {
  if (!isDatabaseConfigured()) {
    return applySampleFilters(sampleSummaries(), filters);
  }

  const records = await getPrisma().product.findMany({
    where: buildWhere(filters),
    include: listProductInclude,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return records.map(toSummary);
}

export async function getAdminProduct(slug: string): Promise<AdminEditableProduct | undefined> {
  if (!isDatabaseConfigured()) return sampleEditableProduct(slug);

  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: editProductInclude,
  });
  if (!product) return undefined;

  return toEditableProduct(product);
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
      parentId: null,
      slug: category.toLowerCase(),
      kind: ProductKind[category as keyof typeof ProductKind] ?? ProductKind.SPC,
      label: `${category} 地板`,
      depth: 0,
      isActive: true,
    }));
  }

  const categories = await getPrisma().category.findMany({
    where: { status: { not: ContentStatus.ARCHIVED } },
    include: {
      parent: {
        include: {
          translations: {
            where: { locale: DatabaseLocale.ZH },
            select: { locale: true, name: true },
          },
        },
      },
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { locale: true, name: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });

  return categories
    .sort((left, right) => {
      const leftRoot = left.parent?.sortOrder ?? left.sortOrder;
      const rightRoot = right.parent?.sortOrder ?? right.sortOrder;
      return leftRoot - rightRoot || Number(Boolean(left.parentId)) - Number(Boolean(right.parentId)) || left.sortOrder - right.sortOrder;
    })
    .map((category) => ({
    id: category.id,
    parentId: category.parentId,
    slug: category.slug,
    kind: category.kind,
    label: category.parent ? `${categoryLabel(category.parent)} / ${categoryLabel(category)}` : categoryLabel(category),
    depth: category.parentId ? 1 : 0,
    isActive: category.isActive,
  }));
}

export async function createProduct(input: CreateProductInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be created.");
  }

  const prisma = getPrisma();
  const conflictingCategory = await prisma.category.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (conflictingCategory) throw new Error("产品 Slug 已被栏目使用，请更换 Slug，避免前台链接冲突。");
  const categoryIds = Array.from(new Set([input.categoryId, ...(input.categoryIds ?? [])]));
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, kind: true } });
  const category = categories.find(({ id }) => id === input.categoryId);
  if (!category) throw new Error("Product category does not exist.");
  if (categories.length !== categoryIds.length) throw new Error("One or more product categories do not exist.");

  return prisma.product.create({
    data: {
      slug: input.slug,
      sku: input.sku,
      kind: category.kind,
      categoryId: category.id,
      categoryAssignments: {
        create: categoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder })),
      },
      status: input.status,
      featured: input.featured,
      sortOrder: input.sortOrder,
      translations: {
        create: {
          locale: DatabaseLocale.ZH,
          title: input.title,
          summary: input.summary,
          seoTitle: input.seoTitle || null,
          seoDescription: input.seoDescription || null,
          status: input.status === ContentStatus.PUBLISHED ? TranslationStatus.PUBLISHED : TranslationStatus.NEEDS_REVIEW,
          publishedAt: input.status === ContentStatus.PUBLISHED ? new Date() : null,
        },
      },
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

export async function updateProductListSettings(input: UpdateProductListSettingsInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be updated.");
  }

  return getPrisma().product.update({
    where: { slug: input.slug },
    data: {
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
    },
  });
}

export async function batchUpdateProducts(slugs: string[], operation: BatchProductOperation) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be updated.");
  }

  const data: Prisma.ProductUpdateManyMutationInput =
    operation === "PUBLISH"
      ? { status: ContentStatus.PUBLISHED }
      : operation === "DRAFT"
        ? { status: ContentStatus.DRAFT }
        : operation === "ARCHIVE"
          ? { status: ContentStatus.ARCHIVED }
          : operation === "FEATURE"
            ? { featured: true }
            : { featured: false };

  return getPrisma().product.updateMany({
    where: { slug: { in: slugs } },
    data,
  });
}

export async function updateProductCore(input: UpdateProductCoreInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be updated.");
  }

  const prisma = getPrisma();
  const categoryIds = Array.from(new Set([input.categoryId, ...input.categoryIds]));
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, kind: true } });
  const category = categories.find(({ id }) => id === input.categoryId);
  if (!category) throw new Error("Product category does not exist.");
  if (categories.length !== categoryIds.length) throw new Error("One or more product categories do not exist.");

  return prisma.product.update({
    where: { slug: input.slug },
    data: {
      sku: input.sku,
      categoryId: category.id,
      categoryAssignments: {
        deleteMany: {},
        create: categoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder })),
      },
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

export async function replaceProductStructuredContent(input: UpdateProductStructuredContentInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before structured product content can be updated.");
  }

  return getPrisma().$transaction(async (prisma) => {
    const product = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (!product) throw new Error("Product does not exist.");

    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productFeature.deleteMany({ where: { productId: product.id } });
    await prisma.productSpecification.deleteMany({ where: { productId: product.id } });
    await prisma.productApplication.deleteMany({ where: { productId: product.id } });
    await prisma.productDownload.deleteMany({ where: { productId: product.id } });

    let primaryImageId: string | null = null;

    for (const item of uniqueByUrl(input.media).sort((a, b) => a.sortOrder - b.sortOrder)) {
      const kind = mediaKindForRole(item.role);
      const asset = await upsertAsset(prisma, { url: item.url, kind, alt: item.alt });
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          assetId: asset.id,
          role: item.role,
          alt: item.alt || null,
          caption: item.caption || null,
          sortOrder: item.sortOrder,
          visible: item.visible,
        },
      });

      if (!primaryImageId && item.visible && item.role === ProductMediaRole.PRIMARY && kind === MediaKind.IMAGE) {
        primaryImageId = asset.id;
      }
      if (!primaryImageId && item.visible && kind === MediaKind.IMAGE) {
        primaryImageId = asset.id;
      }
    }

    for (const item of input.features.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      await prisma.productFeature.create({
        data: {
          productId: product.id,
          icon: item.icon || null,
          sortOrder: item.sortOrder,
          visible: item.visible,
          translations: {
            create: {
              locale: DatabaseLocale.ZH,
              value: item.title,
              description: item.description || null,
            },
          },
        },
      });
    }

    for (const item of input.specifications.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.label.trim() || !item.value.trim()) continue;
      await prisma.productSpecification.create({
        data: {
          productId: product.id,
          group: item.group || null,
          value: item.value,
          unit: item.unit || null,
          sortOrder: item.sortOrder,
          visible: item.visible,
          translations: {
            create: {
              locale: DatabaseLocale.ZH,
              label: item.label,
            },
          },
        },
      });
    }

    for (const item of input.applications.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      const imageAsset = isAllowedAssetUrl(item.imageUrl)
        ? await upsertAsset(prisma, { url: item.imageUrl, kind: MediaKind.IMAGE, alt: item.imageAlt || item.title })
        : null;
      await prisma.productApplication.create({
        data: {
          productId: product.id,
          imageAssetId: imageAsset?.id ?? null,
          sortOrder: item.sortOrder,
          visible: item.visible,
          translations: {
            create: {
              locale: DatabaseLocale.ZH,
              title: item.title,
              description: item.description || null,
            },
          },
        },
      });
    }

    for (const item of uniqueByUrl(input.downloads).sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      const asset = await upsertAsset(prisma, { url: item.url, kind: MediaKind.DOCUMENT, alt: item.title });
      await prisma.productDownload.create({
        data: {
          productId: product.id,
          assetId: asset.id,
          kind: item.kind,
          sortOrder: item.sortOrder,
          visible: item.visible,
          translations: {
            create: {
              locale: DatabaseLocale.ZH,
              title: item.title,
              description: item.description || null,
            },
          },
        },
      });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { primaryImageId },
    });

    return {
      slug: input.slug,
      media: input.media.length,
      features: input.features.length,
      specifications: input.specifications.length,
      applications: input.applications.length,
      downloads: input.downloads.length,
    };
  });
}

export async function attachUploadedProductAsset(input: AttachUploadedProductAssetInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before uploaded assets can be attached.");
  }

  const isImage = input.contentType.startsWith("image/");
  const isVideo = input.contentType.startsWith("video/");
  if (input.kind === "media" && !isImage && !isVideo) {
    throw new Error("Only image and video files can be attached as product media.");
  }
  if (input.kind === "download" && (isImage || isVideo)) {
    throw new Error("Image and video files cannot be attached as product downloads.");
  }
  if (input.kind === "media" && isImage && input.role === ProductMediaRole.VIDEO) {
    throw new Error("An image cannot use the video media role.");
  }

  return getPrisma().$transaction(async (prisma) => {
    const product = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (!product) throw new Error("Product does not exist.");

    const mediaKind = input.kind === "download" ? MediaKind.DOCUMENT : isVideo ? MediaKind.VIDEO : MediaKind.IMAGE;
    const asset = await prisma.mediaAsset.upsert({
      where: { pathname: input.pathname },
      update: {
        url: input.url,
        kind: mediaKind,
        mimeType: input.contentType,
        sizeBytes: input.sizeBytes,
        alt: input.alt || input.title || null,
      },
      create: {
        pathname: input.pathname,
        url: input.url,
        kind: mediaKind,
        mimeType: input.contentType,
        sizeBytes: input.sizeBytes,
        alt: input.alt || input.title || null,
      },
    });

    if (input.kind === "download") {
      const sortOrder = await prisma.productDownload.count({ where: { productId: product.id } });
      await prisma.productDownload.create({
        data: {
          productId: product.id,
          assetId: asset.id,
          kind: input.downloadKind ?? ProductDownloadKind.OTHER,
          sortOrder,
          visible: true,
          translations: {
            create: {
              locale: DatabaseLocale.ZH,
              title: input.title?.trim() || input.pathname.split("/").pop() || "产品资料",
            },
          },
        },
      });
    } else {
      const sortOrder = await prisma.productMedia.count({ where: { productId: product.id } });
      const role = mediaKind === MediaKind.VIDEO ? ProductMediaRole.VIDEO : input.role ?? ProductMediaRole.GALLERY;
      await prisma.productMedia.upsert({
        where: { productId_assetId: { productId: product.id, assetId: asset.id } },
        update: {
          role,
          alt: input.alt || null,
          caption: input.caption || null,
          visible: true,
        },
        create: {
          productId: product.id,
          assetId: asset.id,
          role,
          alt: input.alt || null,
          caption: input.caption || null,
          sortOrder,
          visible: true,
        },
      });

      if (role === ProductMediaRole.PRIMARY && mediaKind === MediaKind.IMAGE) {
        await prisma.product.update({ where: { id: product.id }, data: { primaryImageId: asset.id } });
      }
    }

    return { assetId: asset.id, pathname: asset.pathname, kind: input.kind };
  });
}

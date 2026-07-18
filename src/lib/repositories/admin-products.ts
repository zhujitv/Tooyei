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
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { contentLocales, type ContentLocale } from "@/lib/site";

export type AdminProductSummary = {
  slug: string;
  sku: string;
  category: string;
  categoryId: string | null;
  isClassified: boolean;
  kind: ProductKind;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  title: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  updatedAt: Date | null;
  translationStates: Record<ContentLocale, TranslationStatus>;
  seoStates: Record<ContentLocale, boolean>;
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

export type AdminStructuredTranslationMap<T> = Record<ContentLocale, T>;

export type AdminProductMediaItem = {
  id: string;
  assetId?: string;
  role: ProductMediaRole;
  kind: MediaKind;
  url: string;
  alt: string;
  caption: string;
  sortOrder: number;
  visible: boolean;
  asset?: MediaAssetOption | null;
  translations?: AdminStructuredTranslationMap<{ alt: string; caption: string }>;
};

export type AdminProductFeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  visible: boolean;
  translations?: AdminStructuredTranslationMap<{ title: string; description: string }>;
};

export type AdminProductSpecificationItem = {
  id: string;
  group: string;
  label: string;
  value: string;
  unit: string;
  sortOrder: number;
  visible: boolean;
  translations?: AdminStructuredTranslationMap<{ group: string; label: string; displayValue: string }>;
};

export type AdminProductApplicationItem = {
  id: string;
  assetId?: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  visible: boolean;
  asset?: MediaAssetOption | null;
  translations?: AdminStructuredTranslationMap<{ title: string; description: string; imageAlt: string }>;
};

export type AdminProductDownloadItem = {
  id: string;
  assetId?: string;
  kind: ProductDownloadKind;
  title: string;
  description: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  asset?: MediaAssetOption | null;
  translations?: AdminStructuredTranslationMap<{ title: string; description: string }>;
};

export type AdminEditableProduct = {
  id: string;
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
  classification?: "CLASSIFIED" | "UNCLASSIFIED";
  locale?: ContentLocale;
  translationState?: "MISSING" | "NOT_PUBLISHED";
  seoState?: "READY" | "MISSING";
  page?: number;
  pageSize?: number;
};

export type AdminProductPage = {
  items: AdminProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminProductStats = {
  total: number;
  published: number;
  draft: number;
  archived: number;
  featured: number;
  needsReview: number;
  missing: number;
  missingSeo: number;
  unclassified: number;
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

export type BatchProductOperation =
  | "PUBLISH"
  | "DRAFT"
  | "ARCHIVE"
  | "FEATURE"
  | "UNFEATURE"
  | "ASSIGN_CATEGORY"
  | "FILL_SEO";

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

export type UpdateProductStructuredTranslationsInput = {
  slug: string;
  locale: ContentLocale;
  media: Array<{ id: string; alt: string; caption: string }>;
  features: Array<{ id: string; title: string; description: string }>;
  specifications: Array<{ id: string; group: string; label: string; displayValue: string }>;
  applications: Array<{ id: string; title: string; description: string; imageAlt: string }>;
  downloads: Array<{ id: string; title: string; description: string }>;
};

export type AttachUploadedProductAssetInput = {
  assetId: string;
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

const structuredTranslationMap = <T extends { locale: DatabaseLocale }, R>(
  translations: T[],
  read: (translation: T) => R,
  empty: () => R,
): AdminStructuredTranslationMap<R> =>
  Object.fromEntries(
    contentLocales.map((locale) => {
      const translation = translations.find(({ locale: value }) => value === localeMap[locale]);
      return [locale, translation ? read(translation) : empty()];
    }),
  ) as AdminStructuredTranslationMap<R>;

const sampleDate = new Date(0);

const truncateSeoText = (value: string, maxLength: number) => {
  const characters = Array.from(value.trim());
  return characters.length <= maxLength ? characters.join("") : `${characters.slice(0, maxLength - 1).join("")}…`;
};

const seoTitleFor = (seoTitle: string | null | undefined, title: string) =>
  truncateSeoText(seoTitle?.trim() || title, 70);

const seoDescriptionFor = (seoDescription: string | null | undefined, summary: string) =>
  truncateSeoText(seoDescription?.trim() || summary, 180);

const mediaKindForRole = (role: ProductMediaRole) => (role === ProductMediaRole.VIDEO ? MediaKind.VIDEO : MediaKind.IMAGE);

const sampleEditableProduct = (slug: string): AdminEditableProduct | undefined => {
  const product = sampleProducts.find((candidate) => candidate.slug === slug);
  if (!product) return undefined;
  return {
    id: `sample:${product.slug}`,
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
        id: "sample-primary",
        role: ProductMediaRole.PRIMARY,
        kind: MediaKind.IMAGE,
        url: product.image,
        alt: product.title.zh,
        caption: "",
        sortOrder: 0,
        visible: true,
        translations: Object.fromEntries(
          contentLocales.map((locale) => [locale, { alt: readLocalizedText(product.title, locale), caption: "" }]),
        ) as AdminProductMediaItem["translations"],
      },
    ],
    features: product.features.map((feature, sortOrder) => ({
      id: `sample-feature-${sortOrder}`,
      title: feature.zh,
      description: feature.description?.zh ?? "",
      icon: feature.icon ?? "",
      sortOrder,
      visible: true,
      translations: Object.fromEntries(
        contentLocales.map((locale) => [locale, {
          title: readLocalizedText(feature, locale),
          description: feature.description ? readLocalizedText(feature.description, locale) : "",
        }]),
      ) as AdminProductFeatureItem["translations"],
    })),
    specifications: product.specifications.map((specification, sortOrder) => ({
      id: `sample-specification-${sortOrder}`,
      group: specification.group ?? "",
      label: specification.label.zh,
      value: specification.value,
      unit: specification.unit ?? "",
      sortOrder,
      visible: true,
      translations: Object.fromEntries(
        contentLocales.map((locale) => [locale, {
          group: specification.group ?? "",
          label: readLocalizedText(specification.label, locale),
          displayValue: specification.value,
        }]),
      ) as AdminProductSpecificationItem["translations"],
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
    isClassified: true,
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
    seoStates: Object.fromEntries(contentLocales.map((locale) => [locale, Boolean(product.title[locale])])) as Record<ContentLocale, boolean>,
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

const listProductSelect = {
  slug: true,
  sku: true,
  kind: true,
  status: true,
  featured: true,
  sortOrder: true,
  updatedAt: true,
  categoryId: true,
  category: {
    select: {
      kind: true,
      slug: true,
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { name: true, locale: true },
      },
    },
  },
  translations: {
    select: {
      locale: true,
      status: true,
      title: true,
      seoTitle: true,
      seoDescription: true,
    },
  },
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
      categoryAssignments: true,
    },
  },
} satisfies Prisma.ProductSelect;

const editProductInclude = {
  category: {
    include: {
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { name: true, locale: true },
      },
    },
  },
  translations: true,
  primaryImage: true,
  categoryAssignments: {
    orderBy: { sortOrder: "asc" as const },
    select: { categoryId: true },
  },
  media: {
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    include: { asset: true, translations: true },
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

type AdminProductRecord = Prisma.ProductGetPayload<{ select: typeof listProductSelect }>;
type AdminEditableProductRecord = Prisma.ProductGetPayload<{ include: typeof editProductInclude }>;

const translationFor = (product: AdminProductRecord, locale: ContentLocale) =>
  product.translations.find((translation) => translation.locale === localeMap[locale]);

const zhTranslation = <T extends { locale: DatabaseLocale }>(translations: T[]) =>
  translations.find((translation) => translation.locale === DatabaseLocale.ZH);

const toSummary = (product: AdminProductRecord): AdminProductSummary => {
  const states = Object.fromEntries(
    contentLocales.map((locale) => [locale, translationFor(product, locale)?.status ?? TranslationStatus.MISSING]),
  ) as Record<ContentLocale, TranslationStatus>;
  const seoReadyTranslations = contentLocales.filter((locale) => {
    const translation = translationFor(product, locale);
    return Boolean(translation?.seoTitle?.trim() && translation.seoDescription?.trim());
  }).length;
  const seoStates = Object.fromEntries(
    contentLocales.map((locale) => {
      const translation = translationFor(product, locale);
      return [locale, Boolean(translation?.seoTitle?.trim() && translation.seoDescription?.trim())];
    }),
  ) as Record<ContentLocale, boolean>;
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
    isClassified: product._count.categoryAssignments > 0,
    kind: product.kind,
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    updatedAt: product.updatedAt,
    title: translationFor(product, "zh")?.title ?? translationFor(product, "en")?.title ?? product.sku,
    thumbnailUrl: product.primaryImage?.url ?? "",
    thumbnailAlt: product.primaryImage?.alt ?? translationFor(product, "zh")?.title ?? product.sku,
    translationStates: states,
    seoStates,
    publishedTranslations,
    missingTranslations: contentLocales.filter((locale) => states[locale] === TranslationStatus.MISSING).length,
    seoReadyTranslations,
    contentCounts,
    completion,
  };
};

const toEditableProduct = (product: AdminEditableProductRecord): AdminEditableProduct => {
  const assetOption = (asset: AdminEditableProductRecord["media"][number]["asset"]): MediaAssetOption => ({
    id: asset.id,
    url: asset.url,
    pathname: asset.pathname,
    filename: asset.originalFilename || asset.pathname.split("/").pop() || "未命名资源",
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
  const media = product.media.map(({ asset, role, alt, caption, sortOrder, translations, visible }) => {
    const translation = zhTranslation(translations);
    return {
      id: asset.id,
      role,
      kind: asset.kind,
      url: asset.url,
      alt: translation?.alt ?? alt ?? asset.alt ?? "",
      caption: translation?.caption ?? caption ?? "",
      sortOrder,
      visible,
      asset: assetOption(asset),
      translations: structuredTranslationMap(
        translations,
        (item) => ({ alt: item.alt, caption: item.caption ?? "" }),
        () => ({ alt: "", caption: "" }),
      ),
    };
  });
  const hasPrimary = product.primaryImage && media.some((item) => item.url === product.primaryImage?.url);

  if (product.primaryImage && !hasPrimary) {
    media.unshift({
      id: product.primaryImage.id,
      role: ProductMediaRole.PRIMARY,
      kind: product.primaryImage.kind,
      url: product.primaryImage.url,
      alt: product.primaryImage.alt ?? "",
      caption: "",
      sortOrder: 0,
      visible: true,
      asset: assetOption(product.primaryImage),
      translations: structuredTranslationMap([], () => ({ alt: "", caption: "" }), () => ({ alt: "", caption: "" })),
    });
  }

  return {
    id: product.id,
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
    features: product.features.map(({ id, icon, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        id,
        title: translation?.value ?? "",
        description: translation?.description ?? "",
        icon: icon ?? "",
        sortOrder,
        visible,
        translations: structuredTranslationMap(
          translations,
          (item) => ({ title: item.value, description: item.description ?? "" }),
          () => ({ title: "", description: "" }),
        ),
      };
    }),
    specifications: product.specifications.map(({ id, group, sortOrder, translations, unit, value, visible }) => {
      const translation = zhTranslation(translations);
      return {
        id,
        group: translation?.group ?? group ?? "",
        label: translation?.label ?? "",
        value: translation?.displayValue ?? value,
        unit: unit ?? "",
        sortOrder,
        visible,
        translations: structuredTranslationMap(
          translations,
          (item) => ({ group: item.group ?? "", label: item.label, displayValue: item.displayValue ?? "" }),
          () => ({ group: "", label: "", displayValue: "" }),
        ),
      };
    }),
    applications: product.applications.map(({ id, imageAsset, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        id,
        title: translation?.title ?? "",
        description: translation?.description ?? "",
        imageUrl: imageAsset?.url ?? "",
        imageAlt: translation?.imageAlt ?? imageAsset?.alt ?? "",
        sortOrder,
        visible,
        asset: imageAsset ? assetOption(imageAsset) : null,
        translations: structuredTranslationMap(
          translations,
          (item) => ({ title: item.title, description: item.description ?? "", imageAlt: item.imageAlt ?? "" }),
          () => ({ title: "", description: "", imageAlt: "" }),
        ),
      };
    }),
    downloads: product.downloads.map(({ id, asset, kind, sortOrder, translations, visible }) => {
      const translation = zhTranslation(translations);
      return {
        id,
        kind,
        title: translation?.title ?? "",
        description: translation?.description ?? "",
        url: asset.url,
        sortOrder,
        visible,
        asset: assetOption(asset),
        translations: structuredTranslationMap(
          translations,
          (item) => ({ title: item.title, description: item.description ?? "" }),
          () => ({ title: "", description: "" }),
        ),
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
      { categoryAssignments: { some: { category: { is: { OR: [{ slug: contains }, { translations: { some: { name: contains } } }] } } } } },
    ],
  };
};

const translationLocalesFor = (locale?: ContentLocale) => (locale ? [locale] : contentLocales);

const hasUsableTranslation = (locale: ContentLocale, publishedOnly: boolean): Prisma.ProductWhereInput => ({
  translations: {
    some: {
      locale: localeMap[locale],
      status: publishedOnly ? TranslationStatus.PUBLISHED : { not: TranslationStatus.MISSING },
    },
  },
});

const hasSeoTranslation = (locale: ContentLocale): Prisma.ProductWhereInput => ({
  translations: {
    some: {
      locale: localeMap[locale],
      seoTitle: { not: null },
      seoDescription: { not: null },
      NOT: [{ seoTitle: "" }, { seoDescription: "" }],
    },
  },
});

const missingTranslationWhere = (locale?: ContentLocale, publishedOnly = false): Prisma.ProductWhereInput => ({
  OR: translationLocalesFor(locale).map((item) => ({ NOT: hasUsableTranslation(item, publishedOnly) })),
});

const missingSeoWhere = (locale?: ContentLocale): Prisma.ProductWhereInput => ({
  OR: translationLocalesFor(locale).map((item) => ({ NOT: hasSeoTranslation(item) })),
});

const buildWhere = (filters: AdminProductFilters = {}): Prisma.ProductWhereInput => {
  const clauses: Prisma.ProductWhereInput[] = [];
  const query = filters.q?.trim();

  if (filters.status) clauses.push({ status: filters.status });
  if (filters.kind) clauses.push({ kind: filters.kind });
  if (filters.classification === "CLASSIFIED") clauses.push({ categoryAssignments: { some: {} } });
  if (filters.classification === "UNCLASSIFIED") clauses.push({ categoryAssignments: { none: {} } });
  if (filters.translationState) {
    clauses.push(missingTranslationWhere(filters.locale, filters.translationState === "NOT_PUBLISHED"));
  }
  if (filters.seoState === "MISSING") clauses.push(missingSeoWhere(filters.locale));
  if (filters.seoState === "READY") {
    clauses.push({ AND: translationLocalesFor(filters.locale).map((locale) => hasSeoTranslation(locale)) });
  }
  if (query) clauses.push(searchCondition(query));

  return clauses.length ? { AND: clauses } : {};
};

const applySampleFilters = (products: AdminProductSummary[], filters: AdminProductFilters = {}) => {
  const query = filters.q?.trim().toLowerCase();
  return products.filter((product) => {
    if (filters.status && product.status !== filters.status) return false;
    if (filters.kind && product.kind !== filters.kind) return false;
    if (filters.classification === "CLASSIFIED" && !product.isClassified) return false;
    if (filters.classification === "UNCLASSIFIED" && product.isClassified) return false;
    const localesToCheck = translationLocalesFor(filters.locale);
    if (
      filters.translationState === "MISSING" &&
      !localesToCheck.some((locale) => product.translationStates[locale] === TranslationStatus.MISSING)
    ) return false;
    if (
      filters.translationState === "NOT_PUBLISHED" &&
      !localesToCheck.some((locale) => product.translationStates[locale] !== TranslationStatus.PUBLISHED)
    ) return false;
    if (filters.seoState === "MISSING" && product.seoReadyTranslations === contentLocales.length) return false;
    if (filters.seoState === "READY" && product.seoReadyTranslations !== contentLocales.length) return false;
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
  missingSeo: products.filter((product) => product.seoReadyTranslations < contentLocales.length).length,
  unclassified: products.filter((product) => !product.isClassified).length,
});

const uniqueByAssetId = <T extends { assetId?: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const assetId = item.assetId?.trim();
    if (!assetId || seen.has(assetId)) return false;
    seen.add(assetId);
    return true;
  });
};

const requireManagedAsset = async (
  prisma: Prisma.TransactionClient,
  assetId: string | undefined,
  expectedKind: MediaKind,
) => {
  if (!assetId) throw new Error("结构化内容必须选择媒体中心中的有效资源。");
  const asset = await prisma.mediaAsset.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw new Error("选择的媒体资源不存在、已删除或不可用。");
  if (asset.kind !== expectedKind) throw new Error("媒体资源类型与当前内容位置不匹配。");
  await prisma.mediaAsset.update({ where: { id: asset.id }, data: { orphanedAt: null } });
  return asset;
};

export async function getAdminProducts(filters: AdminProductFilters = {}): Promise<AdminProductPage> {
  const requestedPage = Math.max(1, Math.trunc(filters.page ?? 1));
  const pageSize = Math.min(48, Math.max(12, Math.trunc(filters.pageSize ?? 24)));

  if (!isDatabaseConfigured()) {
    const filtered = applySampleFilters(sampleSummaries(), filters);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(requestedPage, totalPages);
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages,
    };
  }

  const prisma = getPrisma();
  const where = buildWhere(filters);
  const [records, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: listProductSelect,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (requestedPage > totalPages) return getAdminProducts({ ...filters, page: totalPages, pageSize });

  return {
    items: records.map(toSummary),
    total,
    page: requestedPage,
    pageSize,
    totalPages,
  };
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

  const [stats] = await getPrisma().$queryRaw<Array<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    featured: number;
    needs_review: number;
    missing: number;
    missing_seo: number;
    unclassified: number;
  }>>(Prisma.sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE product."status" = 'PUBLISHED')::int AS published,
      COUNT(*) FILTER (WHERE product."status" = 'DRAFT')::int AS draft,
      COUNT(*) FILTER (WHERE product."status" = 'ARCHIVED')::int AS archived,
      COUNT(*) FILTER (WHERE product."featured")::int AS featured,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM "ProductTranslation" translation
        WHERE translation."productId" = product."id" AND translation."status" = 'NEEDS_REVIEW'
      ))::int AS needs_review,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM unnest(ARRAY['EN','DE','FR','ES','RU','JA','IT','AR','ZH']::text[]) AS required(locale)
        WHERE NOT EXISTS (
          SELECT 1 FROM "ProductTranslation" translation
          WHERE translation."productId" = product."id"
            AND translation."locale"::text = required.locale
            AND translation."status" <> 'MISSING'
        )
      ))::int AS missing,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM unnest(ARRAY['EN','DE','FR','ES','RU','JA','IT','AR','ZH']::text[]) AS required(locale)
        WHERE NOT EXISTS (
          SELECT 1 FROM "ProductTranslation" translation
          WHERE translation."productId" = product."id"
            AND translation."locale"::text = required.locale
            AND BTRIM(COALESCE(translation."seoTitle", '')) <> ''
            AND BTRIM(COALESCE(translation."seoDescription", '')) <> ''
        )
      ))::int AS missing_seo,
      COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM "ProductCategory" assignment WHERE assignment."productId" = product."id"
      ))::int AS unclassified
    FROM "Product" product
  `);

  return {
    total: stats?.total ?? 0,
    published: stats?.published ?? 0,
    draft: stats?.draft ?? 0,
    archived: stats?.archived ?? 0,
    featured: stats?.featured ?? 0,
    needsReview: stats?.needs_review ?? 0,
    missing: stats?.missing ?? 0,
    missingSeo: stats?.missing_seo ?? 0,
    unclassified: stats?.unclassified ?? 0,
  };
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
          seoTitle: seoTitleFor(input.seoTitle, input.title),
          seoDescription: seoDescriptionFor(input.seoDescription, input.summary),
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

  if (operation === "ASSIGN_CATEGORY" || operation === "FILL_SEO") {
    throw new Error("This batch operation requires its dedicated handler.");
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

export async function assignProductsToCategory(slugs: string[], categoryId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before products can be categorized.");
  }

  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: categoryId, status: { not: ContentStatus.ARCHIVED } },
    select: { id: true, kind: true },
  });
  if (!category) throw new Error("Product category does not exist or has been archived.");

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    if (products.length !== new Set(slugs).size) throw new Error("One or more products do not exist.");

    const updated = await tx.product.updateMany({
      where: { id: { in: products.map(({ id }) => id) } },
      data: { categoryId: category.id, kind: category.kind },
    });
    await tx.productCategory.createMany({
      data: products.map(({ id: productId }) => ({ productId, categoryId: category.id, sortOrder: 0 })),
      skipDuplicates: true,
    });

    return { count: updated.count, categoryId: category.id };
  });
}

export async function fillMissingProductSeo(slugs: string[]) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before product SEO can be updated.");
  }

  const prisma = getPrisma();
  const translations = await prisma.productTranslation.findMany({
    where: {
      product: { is: { slug: { in: slugs } } },
      OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }],
    },
    select: { id: true, title: true, summary: true, seoTitle: true, seoDescription: true },
  });

  if (!translations.length) return { count: 0 };
  const updates = translations.map((translation) =>
    prisma.productTranslation.update({
      where: { id: translation.id },
      data: {
        seoTitle: seoTitleFor(translation.seoTitle, translation.title),
        seoDescription: seoDescriptionFor(translation.seoDescription, translation.summary),
      },
    }),
  );
  await prisma.$transaction(updates);
  return { count: updates.length };
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
      seoTitle: seoTitleFor(input.seoTitle, input.title),
      seoDescription: seoDescriptionFor(input.seoDescription, input.summary),
      status: input.status,
      publishedAt: input.status === TranslationStatus.PUBLISHED ? new Date() : null,
    },
    create: {
      productId: product.id,
      locale,
      title: input.title,
      summary: input.summary,
      seoTitle: seoTitleFor(input.seoTitle, input.title),
      seoDescription: seoDescriptionFor(input.seoDescription, input.summary),
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
      select: {
        id: true,
        media: { select: { assetId: true } },
        features: { select: { id: true } },
        specifications: { select: { id: true } },
        applications: { select: { id: true } },
        downloads: { select: { id: true } },
      },
    });
    if (!product) throw new Error("Product does not exist.");

    const mediaIds = new Set(product.media.map(({ assetId }) => assetId));
    const featureIds = new Set(product.features.map(({ id }) => id));
    const specificationIds = new Set(product.specifications.map(({ id }) => id));
    const applicationIds = new Set(product.applications.map(({ id }) => id));
    const downloadIds = new Set(product.downloads.map(({ id }) => id));

    const assertOwnedId = (id: string, owned: Set<string>, label: string) => {
      if (id && !owned.has(id)) throw new Error(`${label} does not belong to this product.`);
    };

    input.media.forEach((item) => assertOwnedId(item.id, mediaIds, "Media"));
    input.features.forEach((item) => assertOwnedId(item.id, featureIds, "Feature"));
    input.specifications.forEach((item) => assertOwnedId(item.id, specificationIds, "Specification"));
    input.applications.forEach((item) => assertOwnedId(item.id, applicationIds, "Application"));
    input.downloads.forEach((item) => assertOwnedId(item.id, downloadIds, "Download"));

    let primaryImageId: string | null = null;
    const keptMediaIds: string[] = [];
    const keptFeatureIds: string[] = [];
    const keptSpecificationIds: string[] = [];
    const keptApplicationIds: string[] = [];
    const keptDownloadIds: string[] = [];

    for (const item of uniqueByAssetId(input.media).sort((a, b) => a.sortOrder - b.sortOrder)) {
      const kind = mediaKindForRole(item.role);
      const asset = await requireManagedAsset(prisma, item.assetId, kind);
      keptMediaIds.push(asset.id);
      await prisma.productMedia.upsert({
        where: { productId_assetId: { productId: product.id, assetId: asset.id } },
        update: {
          role: item.role,
          alt: item.alt || null,
          caption: item.caption || null,
          sortOrder: item.sortOrder,
          visible: item.visible,
        },
        create: {
          productId: product.id,
          assetId: asset.id,
          role: item.role,
          alt: item.alt || null,
          caption: item.caption || null,
          sortOrder: item.sortOrder,
          visible: item.visible,
        },
      });

      if (item.id && item.id !== asset.id) {
        const previousTranslations = await prisma.productMediaTranslation.findMany({
          where: { productId: product.id, assetId: item.id },
        });
        for (const translation of previousTranslations) {
          await prisma.productMediaTranslation.upsert({
            where: { productId_assetId_locale: { productId: product.id, assetId: asset.id, locale: translation.locale } },
            update: { alt: translation.alt, caption: translation.caption },
            create: {
              productId: product.id,
              assetId: asset.id,
              locale: translation.locale,
              alt: translation.alt,
              caption: translation.caption,
            },
          });
        }
      }

      await prisma.productMediaTranslation.upsert({
        where: { productId_assetId_locale: { productId: product.id, assetId: asset.id, locale: DatabaseLocale.ZH } },
        update: { alt: item.alt, caption: item.caption || null },
        create: {
          productId: product.id,
          assetId: asset.id,
          locale: DatabaseLocale.ZH,
          alt: item.alt,
          caption: item.caption || null,
        },
      });

      if (!primaryImageId && item.visible && item.role === ProductMediaRole.PRIMARY && kind === MediaKind.IMAGE) {
        primaryImageId = asset.id;
      }
      if (!primaryImageId && item.visible && kind === MediaKind.IMAGE) {
        primaryImageId = asset.id;
      }
    }
    await prisma.productMedia.deleteMany({
      where: { productId: product.id, ...(keptMediaIds.length ? { assetId: { notIn: keptMediaIds } } : {}) },
    });

    for (const item of input.features.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      const feature = item.id
        ? await prisma.productFeature.update({
            where: { id: item.id },
            data: { icon: item.icon || null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          })
        : await prisma.productFeature.create({
            data: { productId: product.id, icon: item.icon || null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          });
      keptFeatureIds.push(feature.id);
      await prisma.productFeatureTranslation.upsert({
        where: { featureId_locale: { featureId: feature.id, locale: DatabaseLocale.ZH } },
        update: { value: item.title, description: item.description || null },
        create: { featureId: feature.id, locale: DatabaseLocale.ZH, value: item.title, description: item.description || null },
      });
    }
    await prisma.productFeature.deleteMany({
      where: { productId: product.id, ...(keptFeatureIds.length ? { id: { notIn: keptFeatureIds } } : {}) },
    });

    for (const item of input.specifications.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.label.trim() || !item.value.trim()) continue;
      const specification = item.id
        ? await prisma.productSpecification.update({
            where: { id: item.id },
            data: { group: item.group || null, value: item.value, unit: item.unit || null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          })
        : await prisma.productSpecification.create({
            data: { productId: product.id, group: item.group || null, value: item.value, unit: item.unit || null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          });
      keptSpecificationIds.push(specification.id);
      await prisma.productSpecificationTranslation.upsert({
        where: { specificationId_locale: { specificationId: specification.id, locale: DatabaseLocale.ZH } },
        update: { group: item.group || null, label: item.label, displayValue: item.value },
        create: { specificationId: specification.id, locale: DatabaseLocale.ZH, group: item.group || null, label: item.label, displayValue: item.value },
      });
    }
    await prisma.productSpecification.deleteMany({
      where: { productId: product.id, ...(keptSpecificationIds.length ? { id: { notIn: keptSpecificationIds } } : {}) },
    });

    for (const item of input.applications.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      const imageAsset = item.assetId ? await requireManagedAsset(prisma, item.assetId, MediaKind.IMAGE) : null;
      const application = item.id
        ? await prisma.productApplication.update({
            where: { id: item.id },
            data: { imageAssetId: imageAsset?.id ?? null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          })
        : await prisma.productApplication.create({
            data: { productId: product.id, imageAssetId: imageAsset?.id ?? null, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          });
      keptApplicationIds.push(application.id);
      await prisma.productApplicationTranslation.upsert({
        where: { applicationId_locale: { applicationId: application.id, locale: DatabaseLocale.ZH } },
        update: { title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
        create: { applicationId: application.id, locale: DatabaseLocale.ZH, title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
      });
    }
    await prisma.productApplication.deleteMany({
      where: { productId: product.id, ...(keptApplicationIds.length ? { id: { notIn: keptApplicationIds } } : {}) },
    });

    for (const item of uniqueByAssetId(input.downloads).sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!item.title.trim()) continue;
      const asset = await requireManagedAsset(prisma, item.assetId, MediaKind.DOCUMENT);
      const download = item.id
        ? await prisma.productDownload.update({
            where: { id: item.id },
            data: { assetId: asset.id, kind: item.kind, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          })
        : await prisma.productDownload.create({
            data: { productId: product.id, assetId: asset.id, kind: item.kind, sortOrder: item.sortOrder, visible: item.visible },
            select: { id: true },
          });
      keptDownloadIds.push(download.id);
      await prisma.productDownloadTranslation.upsert({
        where: { downloadId_locale: { downloadId: download.id, locale: DatabaseLocale.ZH } },
        update: { title: item.title, description: item.description || null },
        create: { downloadId: download.id, locale: DatabaseLocale.ZH, title: item.title, description: item.description || null },
      });
    }
    await prisma.productDownload.deleteMany({
      where: { productId: product.id, ...(keptDownloadIds.length ? { id: { notIn: keptDownloadIds } } : {}) },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { primaryImageId },
    });

    return {
      slug: input.slug,
      media: keptMediaIds.length,
      features: keptFeatureIds.length,
      specifications: keptSpecificationIds.length,
      applications: keptApplicationIds.length,
      downloads: keptDownloadIds.length,
    };
  });
}

export async function updateProductStructuredTranslations(input: UpdateProductStructuredTranslationsInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before structured translations can be updated.");
  }

  const locale = localeMap[input.locale];
  return getPrisma().$transaction(async (prisma) => {
    const product = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        media: { select: { assetId: true } },
        features: { select: { id: true } },
        specifications: { select: { id: true } },
        applications: { select: { id: true } },
        downloads: { select: { id: true } },
      },
    });
    if (!product) throw new Error("Product does not exist.");

    const owned = {
      media: new Set(product.media.map(({ assetId }) => assetId)),
      features: new Set(product.features.map(({ id }) => id)),
      specifications: new Set(product.specifications.map(({ id }) => id)),
      applications: new Set(product.applications.map(({ id }) => id)),
      downloads: new Set(product.downloads.map(({ id }) => id)),
    };
    const assertOwned = (id: string, ids: Set<string>) => {
      if (!ids.has(id)) throw new Error("Structured content item does not belong to this product.");
    };

    for (const item of input.media) {
      assertOwned(item.id, owned.media);
      if (!item.alt.trim() && !item.caption.trim()) {
        await prisma.productMediaTranslation.deleteMany({ where: { productId: product.id, assetId: item.id, locale } });
      } else {
        await prisma.productMediaTranslation.upsert({
          where: { productId_assetId_locale: { productId: product.id, assetId: item.id, locale } },
          update: { alt: item.alt, caption: item.caption || null },
          create: { productId: product.id, assetId: item.id, locale, alt: item.alt, caption: item.caption || null },
        });
      }
    }

    for (const item of input.features) {
      assertOwned(item.id, owned.features);
      if (!item.title.trim() && !item.description.trim()) {
        await prisma.productFeatureTranslation.deleteMany({ where: { featureId: item.id, locale } });
      } else {
        await prisma.productFeatureTranslation.upsert({
          where: { featureId_locale: { featureId: item.id, locale } },
          update: { value: item.title, description: item.description || null },
          create: { featureId: item.id, locale, value: item.title, description: item.description || null },
        });
      }
    }

    for (const item of input.specifications) {
      assertOwned(item.id, owned.specifications);
      if (!item.group.trim() && !item.label.trim() && !item.displayValue.trim()) {
        await prisma.productSpecificationTranslation.deleteMany({ where: { specificationId: item.id, locale } });
      } else {
        await prisma.productSpecificationTranslation.upsert({
          where: { specificationId_locale: { specificationId: item.id, locale } },
          update: { group: item.group || null, label: item.label, displayValue: item.displayValue || null },
          create: { specificationId: item.id, locale, group: item.group || null, label: item.label, displayValue: item.displayValue || null },
        });
      }
    }

    for (const item of input.applications) {
      assertOwned(item.id, owned.applications);
      if (!item.title.trim() && !item.description.trim() && !item.imageAlt.trim()) {
        await prisma.productApplicationTranslation.deleteMany({ where: { applicationId: item.id, locale } });
      } else {
        await prisma.productApplicationTranslation.upsert({
          where: { applicationId_locale: { applicationId: item.id, locale } },
          update: { title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
          create: { applicationId: item.id, locale, title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
        });
      }
    }

    for (const item of input.downloads) {
      assertOwned(item.id, owned.downloads);
      if (!item.title.trim() && !item.description.trim()) {
        await prisma.productDownloadTranslation.deleteMany({ where: { downloadId: item.id, locale } });
      } else {
        await prisma.productDownloadTranslation.upsert({
          where: { downloadId_locale: { downloadId: item.id, locale } },
          update: { title: item.title, description: item.description || null },
          create: { downloadId: item.id, locale, title: item.title, description: item.description || null },
        });
      }
    }

    return {
      slug: input.slug,
      locale: input.locale,
      items: input.media.length + input.features.length + input.specifications.length + input.applications.length + input.downloads.length,
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
      select: { id: true, primaryImageId: true },
    });
    if (!product) throw new Error("Product does not exist.");

    const mediaKind = input.kind === "download" ? MediaKind.DOCUMENT : isVideo ? MediaKind.VIDEO : MediaKind.IMAGE;
    await prisma.$queryRaw`SELECT "id" FROM "MediaAsset" WHERE "id" = ${input.assetId} FOR UPDATE`;
    const existingAsset = await prisma.mediaAsset.findFirst({ where: { id: input.assetId, deletedAt: null } });
    if (!existingAsset) throw new Error("Media asset does not exist or is no longer available.");
    if (existingAsset.pathname !== input.pathname || existingAsset.url !== input.url || existingAsset.kind !== mediaKind) {
      throw new Error("Media asset metadata does not match the requested attachment.");
    }
    const asset = await prisma.mediaAsset.update({ where: { id: existingAsset.id }, data: { orphanedAt: null } });

    // The Blob completion callback and the browser finalizer can arrive together.
    // Serialize attachment for one product/blob pair so downloads cannot be duplicated.
    await prisma.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${product.id}:${asset.id}`}, 0::bigint))`;

    let created = false;
    if (input.kind === "download") {
      const existing = await prisma.productDownload.findFirst({
        where: { productId: product.id, assetId: asset.id },
        select: { id: true },
      });
      const title = input.title?.trim() || input.pathname.split("/").pop() || "产品资料";

      if (existing) {
        await prisma.productDownload.update({
          where: { id: existing.id },
          data: { kind: input.downloadKind ?? ProductDownloadKind.OTHER, visible: true },
        });
        await prisma.productDownloadTranslation.upsert({
          where: { downloadId_locale: { downloadId: existing.id, locale: DatabaseLocale.ZH } },
          update: { title },
          create: { downloadId: existing.id, locale: DatabaseLocale.ZH, title },
        });
      } else {
        const sortOrder = await prisma.productDownload.count({ where: { productId: product.id } });
        await prisma.productDownload.create({
          data: {
            productId: product.id,
            assetId: asset.id,
            kind: input.downloadKind ?? ProductDownloadKind.OTHER,
            sortOrder,
            visible: true,
            translations: { create: { locale: DatabaseLocale.ZH, title } },
          },
        });
        created = true;
      }
    } else {
      const sortOrder = await prisma.productMedia.count({ where: { productId: product.id } });
      const role = mediaKind === MediaKind.VIDEO ? ProductMediaRole.VIDEO : input.role ?? ProductMediaRole.GALLERY;
      const existing = await prisma.productMedia.findUnique({
        where: { productId_assetId: { productId: product.id, assetId: asset.id } },
        select: { assetId: true },
      });
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
      await prisma.productMediaTranslation.upsert({
        where: { productId_assetId_locale: { productId: product.id, assetId: asset.id, locale: DatabaseLocale.ZH } },
        update: { alt: input.alt || input.title || "", caption: input.caption || null },
        create: {
          productId: product.id,
          assetId: asset.id,
          locale: DatabaseLocale.ZH,
          alt: input.alt || input.title || "",
          caption: input.caption || null,
        },
      });
      created = !existing;

      if (mediaKind === MediaKind.IMAGE && (role === ProductMediaRole.PRIMARY || !product.primaryImageId)) {
        await prisma.product.update({ where: { id: product.id }, data: { primaryImageId: asset.id } });
      }
    }

    return { assetId: asset.id, pathname: asset.pathname, kind: input.kind, created };
  });
}

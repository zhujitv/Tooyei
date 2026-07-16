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

export type UpdateProductStructuredContentInput = {
  slug: string;
  media: AdminProductMediaItem[];
  features: AdminProductFeatureItem[];
  specifications: AdminProductSpecificationItem[];
  applications: AdminProductApplicationItem[];
  downloads: AdminProductDownloadItem[];
};

const localeMap: Record<Locale, DatabaseLocale> = {
  zh: DatabaseLocale.ZH,
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
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
} satisfies Prisma.ProductInclude;

const editProductInclude = {
  ...listProductInclude,
  primaryImage: true,
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

const translationFor = (product: AdminProductRecord, locale: Locale) =>
  product.translations.find((translation) => translation.locale === localeMap[locale]);

const zhTranslation = <T extends { locale: DatabaseLocale }>(translations: T[]) =>
  translations.find((translation) => translation.locale === DatabaseLocale.ZH) ?? translations[0];

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
    locales.some((locale) => product.translationStates[locale] === TranslationStatus.NEEDS_REVIEW),
  ).length,
  missing: products.filter((product) =>
    locales.some((locale) => product.translationStates[locale] === TranslationStatus.MISSING),
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

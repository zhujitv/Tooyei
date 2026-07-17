import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ContentStatus,
  Locale,
  PrismaClient,
  ProductKind,
  ProductMediaRole,
  TranslationStatus,
} from "../src/generated/prisma/client";
import { products, readLocalizedText } from "../src/lib/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Tooyei content.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const localeMap = {
  en: Locale.EN, de: Locale.DE, fr: Locale.FR, es: Locale.ES, ru: Locale.RU,
  ja: Locale.JA, it: Locale.IT, ar: Locale.AR, zh: Locale.ZH,
} as const;

const categoryName = (kind: string, locale: keyof typeof localeMap) => {
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

async function seed() {
  for (const product of products) {
    const category = await prisma.category.upsert({
      where: { slug: product.category.toLowerCase() },
      update: { status: ContentStatus.PUBLISHED, isActive: true },
      create: {
        slug: product.category.toLowerCase(),
        kind: ProductKind[product.category as keyof typeof ProductKind],
        status: ContentStatus.PUBLISHED,
        isActive: true,
      },
    });

    for (const locale of Object.keys(localeMap) as (keyof typeof localeMap)[]) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale: localeMap[locale] } },
        update: { name: categoryName(product.category, locale), status: TranslationStatus.PUBLISHED },
        create: {
          categoryId: category.id,
          locale: localeMap[locale],
          name: categoryName(product.category, locale),
          status: TranslationStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    }

    const asset = await prisma.mediaAsset.upsert({
      where: { pathname: product.image },
      update: { url: product.image },
      create: {
        pathname: product.image,
        url: product.image,
        mimeType: "image/jpeg",
        alt: product.title.en,
      },
    });

    const record = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        sku: product.sku,
        categoryId: category.id,
        primaryImageId: asset.id,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        slug: product.slug,
        sku: product.sku,
        kind: ProductKind[product.category as keyof typeof ProductKind],
        categoryId: category.id,
        primaryImageId: asset.id,
        status: ContentStatus.PUBLISHED,
        featured: true,
      },
    });

    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: record.id, categoryId: category.id } },
      update: { sortOrder: 0 },
      create: { productId: record.id, categoryId: category.id, sortOrder: 0 },
    });

    await prisma.productMedia.upsert({
      where: { productId_assetId: { productId: record.id, assetId: asset.id } },
      update: {
        role: ProductMediaRole.PRIMARY,
        alt: product.title.zh,
        sortOrder: 0,
        visible: true,
      },
      create: {
        productId: record.id,
        assetId: asset.id,
        role: ProductMediaRole.PRIMARY,
        alt: product.title.zh,
        sortOrder: 0,
        visible: true,
      },
    });

    await prisma.productFeature.deleteMany({ where: { productId: record.id } });
    await prisma.productSpecification.deleteMany({ where: { productId: record.id } });

    for (const locale of Object.keys(localeMap) as (keyof typeof localeMap)[]) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: record.id, locale: localeMap[locale] } },
        update: {
          title: readLocalizedText(product.title, locale),
          summary: readLocalizedText(product.summary, locale),
          status: product.title[locale] ? TranslationStatus.PUBLISHED : TranslationStatus.NEEDS_REVIEW,
        },
        create: {
          productId: record.id,
          locale: localeMap[locale],
          title: readLocalizedText(product.title, locale),
          summary: readLocalizedText(product.summary, locale),
          status: product.title[locale] ? TranslationStatus.PUBLISHED : TranslationStatus.NEEDS_REVIEW,
          publishedAt: new Date(),
        },
      });
    }

    for (const [sortOrder, feature] of product.features.entries()) {
      await prisma.productFeature.create({
        data: {
          productId: record.id,
          sortOrder,
          translations: {
            create: (Object.keys(localeMap) as (keyof typeof localeMap)[]).map((locale) => ({
              locale: localeMap[locale],
              value: readLocalizedText(feature, locale),
            })),
          },
        },
      });
    }

    for (const [sortOrder, specification] of product.specifications.entries()) {
      await prisma.productSpecification.create({
        data: {
          productId: record.id,
          value: specification.value,
          sortOrder,
          translations: {
            create: (Object.keys(localeMap) as (keyof typeof localeMap)[]).map((locale) => ({
              locale: localeMap[locale],
              label: readLocalizedText(specification.label, locale),
            })),
          },
        },
      });
    }
  }
}

seed()
  .then(() => console.log(`Seeded ${products.length} product migration samples.`))
  .finally(() => prisma.$disconnect());

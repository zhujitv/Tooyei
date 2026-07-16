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
import { products } from "../src/lib/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Tooyei content.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const localeMap = { zh: Locale.ZH, en: Locale.EN, es: Locale.ES, de: Locale.DE } as const;

async function seed() {
  for (const product of products) {
    const category = await prisma.category.upsert({
      where: { slug: product.category.toLowerCase() },
      update: { status: ContentStatus.PUBLISHED },
      create: {
        slug: product.category.toLowerCase(),
        kind: ProductKind[product.category as keyof typeof ProductKind],
        status: ContentStatus.PUBLISHED,
      },
    });

    for (const locale of Object.keys(localeMap) as (keyof typeof localeMap)[]) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale: localeMap[locale] } },
        update: { name: locale === "zh" ? `${product.category} 地板` : `${product.category} Flooring`, status: TranslationStatus.PUBLISHED },
        create: {
          categoryId: category.id,
          locale: localeMap[locale],
          name: locale === "zh" ? `${product.category} 地板` : `${product.category} Flooring`,
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
          title: product.title[locale],
          summary: product.summary[locale],
          status: TranslationStatus.PUBLISHED,
        },
        create: {
          productId: record.id,
          locale: localeMap[locale],
          title: product.title[locale],
          summary: product.summary[locale],
          status: TranslationStatus.PUBLISHED,
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
              value: feature[locale],
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
              label: specification.label[locale],
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

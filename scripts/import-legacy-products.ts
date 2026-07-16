import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { load } from "cheerio";
import {
  ContentStatus,
  Locale,
  MediaKind,
  PrismaClient,
  ProductKind,
  ProductMediaRole,
  TranslationStatus,
} from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

const sourceOrigin = "https://www.tooyei.com";
const sitemapUrl = `${sourceOrigin}/sitemap-main.xml`;
const exportPath = path.join(process.cwd(), "data", "legacy-products.json");
const exportOnly = process.argv.includes("--export-only");
const fromExport = process.argv.includes("--from-export");
const skipBlob = process.argv.includes("--skip-blob");
const onlySlugs = new Set(
  (process.argv.find((argument) => argument.startsWith("--only="))?.slice("--only=".length) ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean),
);
const importConcurrency = Math.max(
  1,
  Math.min(8, Number.parseInt(process.env.CATALOG_IMPORT_CONCURRENCY ?? "2", 10) || 2),
);

type SourceLocale = "en" | "es" | "de";
type CatalogTranslation = { title: string; summary: string; seoTitle: string; seoDescription: string };
type CatalogProduct = {
  sourceUrl: string;
  slug: string;
  sku: string;
  kind: ProductKind;
  translations: Record<SourceLocale, CatalogTranslation>;
  images: Array<{ url: string; alt: string }>;
  specifications: Array<{ label: string; value: string }>;
};

const text = (value: string) => value.replace(/\s+/g, " ").trim();
const absoluteUrl = (value: string, origin = sourceOrigin) => {
  if (value.startsWith("//")) return `https:${value}`;
  return new URL(value, origin).toString();
};
const sourceHost: Record<SourceLocale, string> = {
  en: "https://www.tooyei.com",
  es: "https://es.tooyei.com",
  de: "https://de.tooyei.com",
};

const categoryLocaleMap = { zh: Locale.ZH, en: Locale.EN, es: Locale.ES, de: Locale.DE } as const;
const categoryNames: Record<ProductKind, Record<keyof typeof categoryLocaleMap, string>> = {
  SPC: { zh: "SPC 石塑地板", en: "SPC Flooring", es: "Suelo SPC", de: "SPC-Boden" },
  ESPC: { zh: "ESPC 地板", en: "ESPC Flooring", es: "Suelo ESPC", de: "ESPC-Boden" },
  VSPC: { zh: "VSPC 地板", en: "VSPC Flooring", es: "Suelo VSPC", de: "VSPC-Boden" },
  LSPC: { zh: "LSPC 地板", en: "LSPC Flooring", es: "Suelo LSPC", de: "LSPC-Boden" },
  WPC: { zh: "WPC 地板", en: "WPC Flooring", es: "Suelo WPC", de: "WPC-Boden" },
  LVT: { zh: "LVT 地板", en: "LVT Flooring", es: "Suelo LVT", de: "LVT-Boden" },
  LAMINATE: { zh: "强化地板", en: "Laminate Flooring", es: "Suelo laminado", de: "Laminatboden" },
  WALL_PANEL: { zh: "墙板", en: "Wall Panels", es: "Paneles de pared", de: "Wandpaneele" },
  ACCESSORY: { zh: "地板配件", en: "Flooring Accessories", es: "Accesorios para suelos", de: "Bodenzubehör" },
};

const fetchText = async (url: string) => {
  const response = await fetch(url, { headers: { "user-agent": "Tooyei catalog migration/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
};

const kindFrom = (slug: string, breadcrumbs: string) => {
  const value = `${slug} ${breadcrumbs}`.toLowerCase();
  if (value.includes("wall-panel")) return ProductKind.WALL_PANEL;
  if (value.includes("espc")) return ProductKind.ESPC;
  if (value.includes("vspc")) return ProductKind.VSPC;
  if (value.includes("lspc")) return ProductKind.LSPC;
  if (value.includes("wpc")) return ProductKind.WPC;
  if (value.includes("lvt")) return ProductKind.LVT;
  if (value.includes("laminate")) return ProductKind.LAMINATE;
  return ProductKind.SPC;
};

const skuFrom = (title: string, slug: string) => {
  const matched = title.toUpperCase().match(/\bTY\d+(?:-\d+)?\b/)?.[0];
  if (matched) return matched;
  return `LEGACY-${createHash("sha1").update(slug).digest("hex").slice(0, 10).toUpperCase()}`;
};

const parseTranslation = (html: string): CatalogTranslation => {
  const $ = load(html);
  const title = text($(".prob-info h1").first().text() || $("h1").first().text());
  const lead = text($(".prob-info .jiann").first().text());
  const metaDescription = text($('meta[name="description"]').attr("content") || "");
  const detailLead = text($(".prodetails-desc p").filter((_, element) => text($(element).text()).length > 40).first().text());
  const summary = (lead || metaDescription || detailLead || `${title} from Tooyei's export flooring and wall panel catalog.`).slice(0, 800);
  const seoTitle = text($("title").text()) || title;
  const seoDescription = text($('meta[name="description"]').attr("content") || summary);
  return { title, summary, seoTitle, seoDescription };
};

const parseProduct = async (sourceUrl: string): Promise<CatalogProduct> => {
  const pathname = new URL(sourceUrl).pathname;
  const slug = pathname.split("/").pop()?.replace(/\.html$/, "") ?? "";
  const localizedHtml = await Promise.all(
    (Object.keys(sourceHost) as SourceLocale[]).map(async (locale) => {
      try {
        return [locale, await fetchText(`${sourceHost[locale]}${pathname}`)] as const;
      } catch {
        return [locale, ""] as const;
      }
    }),
  );
  const htmlByLocale = Object.fromEntries(localizedHtml) as Record<SourceLocale, string>;
  if (!htmlByLocale.en) throw new Error(`English product page unavailable: ${sourceUrl}`);
  const $ = load(htmlByLocale.en);
  const translations = Object.fromEntries(
    (Object.keys(sourceHost) as SourceLocale[]).map((locale) => {
      const parsed = htmlByLocale[locale] ? parseTranslation(htmlByLocale[locale]) : parseTranslation(htmlByLocale.en);
      const english = parseTranslation(htmlByLocale.en);
      return [locale, {
        title: parsed.title || english.title,
        summary: parsed.summary || english.summary,
        seoTitle: parsed.seoTitle || parsed.title || english.seoTitle,
        seoDescription: parsed.seoDescription || parsed.summary || english.seoDescription,
      }];
    }),
  ) as Record<SourceLocale, CatalogTranslation>;
  const images = $(".pro-swiper .swiper-slide img")
    .map((_, element) => ({
      url: absoluteUrl($(element).attr("src") || ""),
      alt: text($(element).attr("alt") || translations.en.title),
    }))
    .get()
    .filter((item, index, all) => item.url && all.findIndex((candidate) => candidate.url === item.url) === index);
  const specifications = $(".prodetails-desc table").first().find("tr")
    .map((_, row) => {
      const cells = $(row).find("td").map((__, cell) => text($(cell).text())).get().filter(Boolean);
      return cells.length >= 2 ? { label: cells[0]!, value: cells.at(-1)! } : null;
    })
    .get()
    .filter((item): item is { label: string; value: string } => Boolean(item?.label && item.value && item.label !== item.value));

  return {
    sourceUrl,
    slug,
    sku: skuFrom(translations.en.title, slug),
    kind: kindFrom(slug, `${$(".crumbs, .breadcrumb").text()} ${translations.en.title}`),
    translations,
    images,
    specifications,
  };
};

const mapConcurrent = async <T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>) => {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
};

const exportCatalog = async () => {
  const sitemap = await fetchText(sitemapUrl);
  const urls = Array.from(sitemap.matchAll(/<loc>(https:\/\/www\.tooyei\.com\/products\/[^<]+\.html)<\/loc>/g), (match) => match[1]!)
    .filter((url, index, all) => all.indexOf(url) === index);
  const products = await mapConcurrent(urls, 6, async (url, index) => {
    const product = await parseProduct(url);
    console.log(`[${index + 1}/${urls.length}] Exported ${product.slug}`);
    return product;
  });
  await mkdir(path.dirname(exportPath), { recursive: true });
  await writeFile(exportPath, `${JSON.stringify({ source: sitemapUrl, exportedAt: new Date().toISOString(), products }, null, 2)}\n`);
  console.log(`Catalog export complete: ${products.length} products.`);
  return products;
};

const migrateImage = async (product: CatalogProduct, image: CatalogProduct["images"][number], index: number) => {
  if (skipBlob || !process.env.BLOB_READ_WRITE_TOKEN) return image.url;
  const response = await fetch(image.url);
  if (!response.ok) throw new Error(`Image download failed: ${image.url}`);
  const extension = new URL(image.url).pathname.split(".").pop()?.toLowerCase() || "jpg";
  const blob = await put(`legacy-products/${product.slug}/${index}.${extension}`, await response.arrayBuffer(), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: response.headers.get("content-type") || "image/jpeg",
  });
  return blob.url;
};

const importCatalog = async (products: CatalogProduct[]) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for catalog import.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const localeMap = { en: Locale.EN, es: Locale.ES, de: Locale.DE } as const;
  const selectedProducts = products
    .map((product, sortOrder) => ({ product, sortOrder }))
    .filter(({ product }) => onlySlugs.size === 0 || onlySlugs.has(product.slug));

  if (onlySlugs.size > 0 && selectedProducts.length !== onlySlugs.size) {
    const found = new Set(selectedProducts.map(({ product }) => product.slug));
    const missing = [...onlySlugs].filter((slug) => !found.has(slug));
    throw new Error(`Requested product slugs not found in export: ${missing.join(", ")}`);
  }

  try {
    await mapConcurrent(selectedProducts, importConcurrency, async ({ product, sortOrder }, selectedIndex) => {
      const categorySlug = product.kind.toLowerCase().replaceAll("_", "-");
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { slug: categorySlug, kind: product.kind, status: ContentStatus.PUBLISHED },
      });
      for (const locale of Object.keys(categoryLocaleMap) as Array<keyof typeof categoryLocaleMap>) {
        const databaseLocale = categoryLocaleMap[locale];
        await prisma.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: category.id, locale: databaseLocale } },
          update: { name: categoryNames[product.kind][locale] },
          create: {
            categoryId: category.id,
            locale: databaseLocale,
            name: categoryNames[product.kind][locale],
            status: TranslationStatus.PUBLISHED,
            publishedAt: new Date(),
          },
        });
      }
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
        select: { id: true, status: true },
      });
      const record = await prisma.product.upsert({
        where: { slug: product.slug },
        update: { kind: product.kind, categoryId: category.id, sortOrder },
        create: {
          slug: product.slug,
          sku: product.sku,
          kind: product.kind,
          categoryId: category.id,
          sortOrder,
          status: ContentStatus.DRAFT,
        },
      });

      for (const locale of Object.keys(localeMap) as SourceLocale[]) {
        const translation = product.translations[locale];
        if (!translation.title || !translation.summary) continue;
        await prisma.productTranslation.upsert({
          where: { productId_locale: { productId: record.id, locale: localeMap[locale] } },
          update: {
            title: translation.title,
            summary: translation.summary,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription,
          },
          create: {
            productId: record.id,
            locale: localeMap[locale],
            title: translation.title,
            summary: translation.summary,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription,
            status: TranslationStatus.NEEDS_REVIEW,
          },
        });
      }

      for (const [imageIndex, image] of product.images.entries()) {
        const url = await migrateImage(product, image, imageIndex);
        const pathname = new URL(url).pathname;
        const asset = await prisma.mediaAsset.upsert({
          where: { pathname },
          update: { url, alt: image.alt },
          create: { pathname, url, alt: image.alt, kind: MediaKind.IMAGE, mimeType: "image/jpeg" },
        });
        await prisma.productMedia.upsert({
          where: { productId_assetId: { productId: record.id, assetId: asset.id } },
          update: { role: imageIndex === 0 ? ProductMediaRole.PRIMARY : ProductMediaRole.GALLERY, sortOrder: imageIndex, visible: true },
          create: { productId: record.id, assetId: asset.id, role: imageIndex === 0 ? ProductMediaRole.PRIMARY : ProductMediaRole.GALLERY, sortOrder: imageIndex, visible: true },
        });
        if (imageIndex === 0) await prisma.product.update({ where: { id: record.id }, data: { primaryImageId: asset.id } });
      }

      if (!existing || existing.status === ContentStatus.DRAFT) {
        await prisma.$transaction(
          [
            prisma.productSpecification.deleteMany({ where: { productId: record.id } }),
            ...product.specifications.map((specification, specIndex) =>
              prisma.productSpecification.create({
                data: {
                  productId: record.id,
                  value: specification.value,
                  sortOrder: specIndex,
                  translations: { create: { locale: Locale.EN, label: specification.label } },
                },
              }),
            ),
          ],
          { timeout: 30_000 },
        );
      }
      console.log(`[${selectedIndex + 1}/${selectedProducts.length}] Imported ${product.slug}`);
    });
    console.log(`Catalog import complete: ${selectedProducts.length} products checked.`);
  } finally {
    await prisma.$disconnect();
  }
};

async function main() {
  const products = fromExport
    ? (JSON.parse(await readFile(exportPath, "utf8")) as { products: CatalogProduct[] }).products
    : await exportCatalog();
  if (!exportOnly) await importCatalog(products);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

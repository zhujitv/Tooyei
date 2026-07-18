import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { ProductsPage } from "@/components/products-page";
import { readLocalizedText } from "@/lib/content";
import { getPublicCategoryBySlug } from "@/lib/repositories/categories";
import { getPublishedProduct } from "@/lib/repositories/products";
import { isLocale, localizedAlternates, localizedPath } from "@/lib/site";
import { safeMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  return safeMetadata("metadata.products.detail.localized", async () => {
  const { locale = "", slug = "" } = await params;
  if (!isLocale(locale)) return {};
  const [category, product] = await Promise.all([getPublicCategoryBySlug(slug, locale), getPublishedProduct(slug)]);
  if (category) {
    return {
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description,
      alternates: {
        canonical: localizedPath(locale, `/products/${slug}`),
        languages: localizedAlternates(`/products/${slug}`),
      },
    };
  }
  if (!product) return { title: "TOOYEI Products" };
  const productTitle = readLocalizedText(product.title, locale);
  const categoryName = product.primaryCategory ? readLocalizedText(product.primaryCategory.name, locale) : "";

  return {
    title: (product.seoTitle && readLocalizedText(product.seoTitle, locale)) || `${productTitle}${categoryName ? ` | ${categoryName}` : ""}`,
    description: (product.seoDescription && readLocalizedText(product.seoDescription, locale)) || readLocalizedText(product.summary, locale),
    alternates: {
      canonical: localizedPath(locale, `/products/${slug}`),
      languages: localizedAlternates(`/products/${slug}`),
    },
  };
  }, { title: "TOOYEI Products" });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [category, product] = await Promise.all([getPublicCategoryBySlug(slug, locale), getPublishedProduct(slug)]);
  if (category) return <ProductsPage locale={locale} categorySlug={slug} />;
  if (!product) notFound();
  return <ProductPage product={product} locale={locale} />;
}

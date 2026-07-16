import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getPublishedProduct } from "@/lib/repositories/products";
import { isLocale } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale === "zh") return {};
  const product = await getPublishedProduct(slug);
  if (!product) return {};

  return {
    title: product.seoTitle?.[locale] || `${product.sku} ${product.title[locale]}`,
    description: product.seoDescription?.[locale] || product.summary[locale],
    alternates: {
      canonical: `/${locale}/products/${slug}`,
      languages: {
        zh: `/products/${slug}`,
        en: `/en/products/${slug}`,
        es: `/es/products/${slug}`,
        de: `/de/products/${slug}`,
        "x-default": `/products/${slug}`,
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale === "zh") notFound();
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} locale={locale} />;
}

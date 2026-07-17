import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { ProductsPage } from "@/components/products-page";
import { getPublicCategoryBySlug } from "@/lib/repositories/categories";
import { getPublishedProduct } from "@/lib/repositories/products";
import { localizedAlternates, localizedPath } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [category, product] = await Promise.all([getPublicCategoryBySlug(slug, "zh"), getPublishedProduct(slug)]);
  if (category) {
    return {
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description,
      alternates: {
        canonical: localizedPath("zh", `/products/${slug}`),
        languages: localizedAlternates(`/products/${slug}`),
      },
    };
  }
  if (!product) return {};

  return {
    title: product.seoTitle?.zh || `${product.title.zh}${product.primaryCategory ? ` | ${product.primaryCategory.name.zh}` : ""}`,
    description: product.seoDescription?.zh || product.summary.zh,
    alternates: {
      canonical: localizedPath("zh", `/products/${slug}`),
      languages: localizedAlternates(`/products/${slug}`),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, product] = await Promise.all([getPublicCategoryBySlug(slug, "zh"), getPublishedProduct(slug)]);
  if (category) return <ProductsPage locale="zh" categorySlug={slug} />;
  if (!product) notFound();
  return <ProductPage product={product} locale="zh" />;
}

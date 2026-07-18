import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { ProductsPage } from "@/components/products-page";
import { getPublicCategoryBySlug } from "@/lib/repositories/categories";
import { getPublishedProduct } from "@/lib/repositories/products";
import { localizedAlternates, localizedPath } from "@/lib/site";
import { safeMetadata } from "@/lib/metadata";
import { readLocalizedText } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return safeMetadata("metadata.products.detail.zh", async () => {
  const { slug = "" } = await params;
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
  if (!product) return { title: "TOOYEI 产品" };

  return {
    title: readLocalizedText(product.seoTitle, "zh") || `${readLocalizedText(product.title, "zh") || product.sku}${product.primaryCategory ? ` | ${readLocalizedText(product.primaryCategory.name, "zh")}` : ""}`,
    description: readLocalizedText(product.seoDescription, "zh") || readLocalizedText(product.summary, "zh") || "TOOYEI flooring product",
    alternates: {
      canonical: localizedPath("zh", `/products/${slug}`),
      languages: localizedAlternates(`/products/${slug}`),
    },
  };
  }, { title: "TOOYEI 产品" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, product] = await Promise.all([getPublicCategoryBySlug(slug, "zh"), getPublishedProduct(slug)]);
  if (category) return <ProductsPage locale="zh" categorySlug={slug} />;
  if (!product) notFound();
  return <ProductPage product={product} locale="zh" />;
}

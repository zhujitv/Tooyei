import { notFound } from "next/navigation";
import { ContactPage } from "@/components/contact-page";
import { getPublishedProducts } from "@/lib/repositories/products";
import { isLocale } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; submitted?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "zh") notFound();
  const query = await searchParams;
  const products = await getPublishedProducts();

  return (
    <ContactPage
      locale={locale}
      products={products}
      selectedProductSlug={query.product}
      feedback={{ submitted: query.submitted === "1", error: query.error }}
    />
  );
}

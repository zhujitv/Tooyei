import { ContactPage } from "@/components/contact-page";
import { getPublishedProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const products = await getPublishedProducts();

  return (
    <ContactPage
      locale="zh"
      products={products}
      selectedProductSlug={params.product}
      feedback={{ submitted: params.submitted === "1", error: params.error }}
    />
  );
}

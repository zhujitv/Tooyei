import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { getPublishedProducts } from "@/lib/repositories/products";
import type { Locale } from "@/lib/site";

export async function ProductsPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const products = await getPublishedProducts();
  return <div className="min-h-screen bg-[#fbfaf7]"><SiteHeader locale={locale}/><main><section className="bg-[#1c201d] text-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">{locale === "zh" ? t.catalogueEyebrow : "PRODUCT CATALOGUE"}</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">{t.products}</h1><p className="mt-5 max-w-2xl leading-7 text-white/60">{locale === "zh" ? t.catalogueBody : "SPC, WPC and LVT collections organized as structured product data and ready for multilingual publishing."}</p></div></section><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product)=><ProductCard key={product.slug} product={product} locale={locale}/>)}</div></section></main><SiteFooter locale={locale}/></div>;
}

import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { getPublishedProducts } from "@/lib/repositories/products";
import type { Locale } from "@/lib/site";

export async function ProductsPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const products = await getPublishedProducts();
  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="site-dark-panel">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            <p className="brand-eyebrow">{locale === "zh" ? t.catalogueEyebrow : "PRODUCT CATALOGUE"}</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{t.products}</h1>
            <p className="mt-6 max-w-2xl leading-8 text-white/65">
              {locale === "zh"
                ? t.catalogueBody
                : "SPC, WPC and LVT collections organized as structured product data and ready for multilingual publishing."}
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="brand-eyebrow">Systems</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {locale === "zh" ? "可量产、可定制、可发布的产品体系" : "Production-ready flooring systems"}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {locale === "zh" ? "面向批发、项目和 OEM 场景，按结构化数据维护产品、参数和多语言内容。" : "Built for wholesale, project and OEM sourcing workflows."}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

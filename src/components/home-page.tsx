import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Factory, Globe2, Layers3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { getPublishedProducts } from "@/lib/repositories/products";
import { localizedPath, type Locale } from "@/lib/site";

export async function HomePage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const products = await getPublishedProducts();
  const proofPoints = [
    [Layers3, t.waterproof], [Factory, t.oemShort], [CheckCircle2, t.compliance], [MessageCircle, t.response],
  ] as const;
  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="relative min-h-[680px] overflow-hidden bg-[#0b1220] text-white lg:min-h-[760px]">
          <Image src="/media/product-tile-spc.jpg" alt="Modern interior featuring Tooyei tile-look flooring" fill priority sizes="100vw" className="object-cover object-center opacity-68" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,20,0.96),rgba(11,18,32,0.74)_48%,rgba(11,18,32,0.18))]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b1220] to-transparent" />
          <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-5 py-24 lg:min-h-[720px] lg:px-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="rounded-full border-white/20 bg-white/10 px-4 py-1.5 text-white/85 backdrop-blur">{t.heroEyebrow}</Badge>
              <h1 className="mt-8 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">{t.heroTitle}</h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/72 sm:text-lg">{t.heroBody}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="site-accent-button"><Link href={localizedPath(locale, "/products")}>{t.explore}<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-[#0b1220]"><Link href={localizedPath(locale, "/contact")}>{t.discuss}</Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 px-5 md:grid-cols-4 lg:px-8">
            {proofPoints.map(([Icon, label]) => <div key={label} className="flex items-center gap-3 px-3 py-6 text-sm font-semibold text-slate-700 sm:px-6"><Icon className="size-5 shrink-0 text-[#b68a4c]" />{label}</div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="brand-eyebrow">01 · {locale === "zh" ? t.collectionsLabel : "COLLECTIONS"}</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{t.featured}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{t.featuredBody}</p></div>
            <Button asChild variant="outline" className="border-slate-300 bg-white"><Link href={localizedPath(locale, "/products")}>{t.viewAll}<ArrowRight /></Link></Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
        </section>

        <section id="company" className="site-dark-panel">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-32">
            <div><p className="brand-eyebrow">02 · {locale === "zh" ? t.whyLabel : "WHY TOOYEI"}</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{t.proof}</h2><p className="mt-6 max-w-xl leading-7 text-white/60">{t.proofBody}</p></div>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {[ ["15+", locale === "zh" ? t.exportMarkets : "Export markets"], ["4", locale === "zh" ? t.coreSystems : "Core flooring systems"], ["OEM", locale === "zh" ? t.flexibleSpecs : "Flexible specifications"], ["B2B", locale === "zh" ? t.projectService : "Project-first service"] ].map(([value,label]) => <div key={label} className="bg-white/[0.045] p-8"><p className="text-4xl font-semibold text-white">{value}</p><p className="mt-3 text-sm text-white/50">{label}</p></div>)}
            </div>
          </div>
        </section>

        <section id="oem" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#e7eaf0] shadow-[0_24px_70px_rgba(15,23,42,0.12)]"><Image src="/media/product-eir-spc.jpg" alt="OEM flooring finish sample" fill sizes="50vw" className="object-cover" /></div>
          <div><p className="brand-eyebrow">03 · OEM / ODM</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{locale === "zh" ? t.builtForMarket : "Built around your market."}</h2><p className="mt-6 leading-7 text-muted-foreground">{locale === "zh" ? t.oemBody : "Choose dimensions, wear layers, surface textures, colors, backing, locking systems and packaging. The new content platform will manage each option as structured data instead of static page copy."}</p><div className="mt-8 flex flex-wrap gap-2">{(locale === "zh" ? ["尺寸", "耐磨层", "EIR 纹理", "花色", "底垫", "自有品牌"] : ["Dimensions", "Wear layer", "EIR texture", "Color & decor", "Backing", "Private label"]).map((item)=><Badge key={item} variant="secondary" className="rounded-full px-3 py-1.5">{item}</Badge>)}</div></div>
        </section>

        <section id="resources" className="bg-[#b68a4c] text-[#0b1220]"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center lg:px-8"><div><Globe2 className="size-7"/><h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{locale === "zh" ? t.readyTitle : "Ready to source your next flooring collection?"}</h2></div><Button asChild size="lg" className="bg-[#0b1220] text-white hover:bg-[#172033]"><Link href={localizedPath(locale, "/contact")}>{t.discuss}<ArrowRight /></Link></Button></div></section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

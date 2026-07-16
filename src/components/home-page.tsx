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
    <div className="min-h-screen bg-[#fbfaf7]">
      <SiteHeader locale={locale} />
      <main>
        <section className="relative min-h-[640px] overflow-hidden bg-[#171a18] text-white lg:min-h-[720px]">
          <Image src="/media/product-tile-spc.jpg" alt="Modern interior featuring Tooyei tile-look flooring" fill priority sizes="100vw" className="object-cover object-center opacity-72" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
          <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-5 py-24 lg:min-h-[720px] lg:px-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="border-white/25 bg-black/20 text-white">{t.heroEyebrow}</Badge>
              <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{t.heroTitle}</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">{t.heroBody}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-[#a63429] text-white hover:bg-[#8d2b23]"><Link href={localizedPath(locale, "/products")}>{t.explore}<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-black/10 text-white hover:bg-white hover:text-black"><Link href={localizedPath(locale, "/contact")}>{t.discuss}</Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-[#a63429] text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/15 px-5 md:grid-cols-4 lg:px-8">
            {proofPoints.map(([Icon, label]) => <div key={label} className="flex items-center gap-3 px-3 py-6 text-sm font-semibold sm:px-6"><Icon className="size-5 shrink-0" />{label}</div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="text-xs font-bold tracking-[0.18em] text-[#a63429]">01 · COLLECTIONS</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t.featured}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{t.featuredBody}</p></div>
            <Button asChild variant="outline"><Link href={localizedPath(locale, "/products")}>{t.viewAll}<ArrowRight /></Link></Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
        </section>

        <section id="company" className="bg-[#1c201d] text-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-32">
            <div><p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">02 · WHY TOOYEI</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t.proof}</h2><p className="mt-6 max-w-xl leading-7 text-white/60">{t.proofBody}</p></div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {[ ["15+", "Export markets"], ["4", "Core flooring systems"], ["OEM", "Flexible specifications"], ["B2B", "Project-first service"] ].map(([value,label]) => <div key={label} className="bg-[#1c201d] p-8"><p className="text-4xl font-semibold text-white">{value}</p><p className="mt-3 text-sm text-white/50">{label}</p></div>)}
            </div>
          </div>
        </section>

        <section id="oem" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#ece7df]"><Image src="/media/product-eir-spc.jpg" alt="OEM flooring finish sample" fill sizes="50vw" className="object-cover" /></div>
          <div><p className="text-xs font-bold tracking-[0.18em] text-[#a63429]">03 · OEM / ODM</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">Built around your market.</h2><p className="mt-6 leading-7 text-muted-foreground">Choose dimensions, wear layers, surface textures, colors, backing, locking systems and packaging. The new content platform will manage each option as structured data instead of static page copy.</p><div className="mt-8 flex flex-wrap gap-2">{["Dimensions", "Wear layer", "EIR texture", "Color & decor", "Backing", "Private label"].map((item)=><Badge key={item} variant="secondary" className="px-3 py-1.5">{item}</Badge>)}</div></div>
        </section>

        <section id="resources" className="bg-[#a63429] text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center lg:px-8"><div><Globe2 className="size-7"/><h2 className="mt-5 text-3xl font-semibold">Ready to source your next flooring collection?</h2></div><Button asChild size="lg" className="bg-white text-[#7e241d] hover:bg-white/90"><Link href={localizedPath(locale, "/contact")}>{t.discuss}<ArrowRight /></Link></Button></div></section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

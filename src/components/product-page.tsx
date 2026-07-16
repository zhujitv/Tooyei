import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/content";
import { copy } from "@/lib/content";
import { localizedPath, type Locale } from "@/lib/site";

export function ProductPage({ product, locale }: { product: Product; locale: Locale }) {
  const t = copy[locale];
  const contactHref = `${localizedPath(locale, "/contact")}?product=${encodeURIComponent(product.slug)}`;
  return <div className="min-h-screen bg-[#fbfaf7]"><SiteHeader locale={locale}/><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16"><Button asChild variant="ghost" className="-ml-3 mb-7"><Link href={localizedPath(locale,"/products")}><ArrowLeft/>{t.products}</Link></Button><div className="grid gap-12 lg:grid-cols-2 lg:items-start"><div className="relative aspect-square overflow-hidden bg-[#ece7df]"><Image src={product.image} alt={`${product.sku} ${product.title[locale]}`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/></div><div className="lg:pt-8"><div className="flex items-center gap-3"><Badge>{product.category}</Badge><span className="text-xs font-bold tracking-[0.16em] text-[#a63429]">{product.sku}</span></div><h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{product.title[locale]}</h1><p className="mt-6 text-lg leading-8 text-muted-foreground">{product.summary[locale]}</p><ul className="mt-8 grid gap-3 sm:grid-cols-2">{product.features.map((feature)=><li key={feature.en} className="flex items-center gap-2 text-sm font-medium"><span className="grid size-6 place-items-center rounded-full bg-[#a63429]/10 text-[#a63429]"><Check className="size-3.5"/></span>{feature[locale]}</li>)}</ul><Separator className="my-9"/><dl className="space-y-4">{product.specifications.map((item)=><div key={item.label.en} className="grid grid-cols-[130px_1fr] gap-4 text-sm"><dt className="text-muted-foreground">{item.label[locale]}</dt><dd className="font-medium">{item.value}</dd></div>)}</dl><Button asChild size="lg" className="mt-10 bg-[#a63429] hover:bg-[#8d2b23]"><Link href={contactHref}>{t.discuss}<ArrowRight/></Link></Button></div></div></main><SiteFooter locale={locale}/></div>;
}

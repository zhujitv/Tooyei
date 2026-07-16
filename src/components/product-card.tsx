import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/content";
import { copy } from "@/lib/content";
import { localizedPath, type Locale } from "@/lib/site";

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  return (
    <Card className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white py-0 shadow-[0_22px_60px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
      <Link href={localizedPath(locale, `/products/${product.slug}`)}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e3e7ed]">
          <Image src={product.image} alt={`${product.sku} ${product.title[locale]}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <Badge className="absolute left-4 top-4 rounded-full bg-white/95 px-3 text-[#111827] shadow-sm">{product.category}</Badge>
        </div>
        <CardContent className="p-6">
          <p className="brand-eyebrow">{product.sku}</p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-950">{product.title[locale]}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.summary[locale]}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0b1220]">{copy[locale].viewProduct}<ArrowUpRight className="size-4 text-[#b68a4c]" /></span>
        </CardContent>
      </Link>
    </Card>
  );
}

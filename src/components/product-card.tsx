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
    <Card className="group overflow-hidden rounded-none border border-slate-200/90 bg-white py-0 shadow-none transition duration-300 hover:border-slate-300 hover:shadow-[0_24px_65px_rgba(15,23,42,0.09)]">
      <Link href={localizedPath(locale, `/products/${product.slug}`)}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e3e7ed]">
          <Image src={product.image} alt={`${product.sku} ${product.title[locale]}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]" />
          <Badge className="absolute left-4 top-4 rounded-none border border-white/30 bg-white/90 px-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#111827] shadow-none backdrop-blur">{product.category}</Badge>
        </div>
        <CardContent className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9a7138]">{product.sku}</p>
            <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-[#9a7138]" />
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-slate-950">{product.title[locale]}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.summary[locale]}</p>
          <span className="mt-6 inline-flex items-center gap-2 border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#0b1220] transition group-hover:border-[#b68a4c]">{copy[locale].viewProduct}</span>
        </CardContent>
      </Link>
    </Card>
  );
}

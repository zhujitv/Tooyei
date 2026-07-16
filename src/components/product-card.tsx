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
    <Card className="group overflow-hidden border-0 bg-[#f1eee8] py-0 shadow-none">
      <Link href={localizedPath(locale, `/products/${product.slug}`)}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#ded9d0]">
          <Image src={product.image} alt={`${product.sku} ${product.title[locale]}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <Badge className="absolute left-4 top-4 bg-white/90 text-[#242824]">{product.category}</Badge>
        </div>
        <CardContent className="p-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#a63429]">{product.sku}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">{product.title[locale]}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.summary[locale]}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">{copy[locale].viewProduct}<ArrowUpRight className="size-4" /></span>
        </CardContent>
      </Link>
    </Card>
  );
}

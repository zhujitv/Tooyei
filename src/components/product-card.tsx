import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/content";
import { copy, readLocalizedText } from "@/lib/content";
import { localizedPath, toContentLocale, type Locale } from "@/lib/site";

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const tags = product.features.map((feature) => readLocalizedText(feature, locale)).filter(Boolean).slice(0, 3);
  const title = readLocalizedText(product.title, locale);
  const summary = readLocalizedText(product.summary, locale);
  const categoryName = product.primaryCategory ? readLocalizedText(product.primaryCategory.name, locale) : product.category;

  return (
    <Link
      href={localizedPath(locale, `/products/${product.slug}`)}
      className="group flex h-full flex-col overflow-hidden border border-[var(--border)] bg-white transition-colors duration-300 hover:border-[var(--gold)]/55"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e3e2de]">
        <Image src={product.image} alt={`${product.sku} ${title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        <span className="absolute left-4 top-4 border border-white/40 bg-white/90 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--navy)] backdrop-blur">{categoryName}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">{product.sku}</p>
        <h3 className="mt-4 min-h-[3.4rem] text-xl font-medium leading-[1.35] tracking-[-0.025em] text-[var(--navy)]">{title}</h3>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{summary}</p>
        {tags.length > 0 ? (
          <div className="mt-5 flex min-h-14 flex-wrap content-start gap-2">
            {tags.map((tag) => (
              <span key={tag} className="border border-[var(--border)] bg-[var(--paper)] px-2.5 py-1 text-[0.66rem] font-medium text-[var(--muted)]">{tag}</span>
            ))}
          </div>
        ) : null}
        <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--navy)]">
          {copy[toContentLocale(locale)].viewProduct}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { capabilitiesCopy, capabilityMedia, capabilitySlugs } from "@/lib/capabilities";
import { localizedPath, type Locale } from "@/lib/site";

type CapabilityCardsProps = {
  locale: Locale;
  compact?: boolean;
};

export function CapabilityCards({ locale, compact = false }: CapabilityCardsProps) {
  const labels = capabilitiesCopy[locale];

  return (
    <div className={compact ? "grid gap-4 lg:grid-cols-3" : "grid gap-5 lg:grid-cols-3"}>
      {capabilitySlugs.map((slug, index) => {
        const page = labels.pages[slug];
        const media = capabilityMedia[slug];

        return (
          <Link
            key={slug}
            href={localizedPath(locale, `/capabilities/${slug}`)}
            className="group overflow-hidden border border-[var(--border)] bg-white text-[var(--text)] transition-shadow duration-300 hover:shadow-[0_18px_50px_rgba(8,17,31,0.08)]"
          >
            <div className={compact ? "relative aspect-[16/10] overflow-hidden bg-slate-200" : "relative aspect-[4/3] overflow-hidden bg-slate-200"}>
              <Image
                src={media.card}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/30 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 bg-[var(--navy)]/85 px-3 py-2 font-mono text-[0.62rem] font-semibold tracking-[0.16em] text-white backdrop-blur-sm rtl:left-auto rtl:right-4">
                0{index + 1} / TOOYEI
              </span>
            </div>
            <div className={compact ? "flex min-h-52 flex-col p-5 sm:p-6" : "flex min-h-64 flex-col p-6 sm:p-7"}>
              <div className="flex items-center justify-between gap-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--gold)]">{page.eyebrow}</p>
                <ArrowUpRight className="size-5 text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold)]" />
              </div>
              <h3 className={compact ? "mt-4 text-xl font-medium leading-tight tracking-[-0.035em] text-[var(--navy)]" : "mt-4 text-2xl font-medium leading-tight tracking-[-0.04em] text-[var(--navy)] sm:text-[1.7rem]"}>{page.title}</h3>
              <p className={compact ? "mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]" : "mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]"}>{page.summary}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-bold uppercase tracking-[0.1em] text-[var(--navy)]">
                {labels.viewDetails}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

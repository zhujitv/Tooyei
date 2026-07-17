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
            className="group relative isolate min-h-[25rem] overflow-hidden bg-[var(--navy)] text-white"
          >
            <Image
              src={media.card}
              alt={page.title}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.05)_20%,rgba(8,17,31,0.92)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-5">
                <p className="font-mono text-[0.65rem] font-semibold tracking-[0.18em] text-[var(--gold)]">
                  0{index + 1} / TOOYEI
                </p>
                <ArrowUpRight className="size-5 text-white/55 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold)]" />
              </div>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.035em] sm:text-[1.7rem]">{page.eyebrow}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/65">{page.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-white">
                {labels.viewDetails}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

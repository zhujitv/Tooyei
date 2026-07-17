import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CapabilityCards } from "@/components/capability-cards";
import { CapabilityProofSystem } from "@/components/capability-proof-system";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { capabilitiesCopy, capabilityMedia } from "@/lib/capabilities";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { localizedPath, type Locale } from "@/lib/site";

export async function CapabilitiesPage({ locale }: { locale: Locale }) {
  const labels = capabilitiesCopy[locale];
  const categories = await getPublicCategoryTree(locale);

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} />
      <main>
        <section className="relative isolate overflow-hidden bg-[var(--navy)] text-white">
          <div className="absolute inset-y-0 right-0 hidden w-[56%] lg:block">
            <Image
              src={capabilityMedia["quality-inspection"].hero}
              alt={labels.pages["quality-inspection"].title}
              fill
              priority
              sizes="56vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--navy)_0%,rgba(8,17,31,0.67)_32%,rgba(8,17,31,0.05)_100%)]" />
          </div>
          <div aria-hidden="true" className="absolute -left-24 top-14 size-96 rounded-full border border-white/[0.055]" />
          <div className="relative mx-auto flex min-h-[35rem] max-w-[86rem] items-center px-5 py-20 lg:px-10 lg:py-24">
            <div className="max-w-[43rem]">
              <p className="brand-eyebrow-light"><span />{labels.hub.eyebrow}</p>
              <h1 className="mt-6 text-[clamp(2.7rem,5.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.06em]">
                {labels.hub.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">{labels.hub.summary}</p>
            </div>
          </div>
        </section>

        <CapabilityProofSystem locale={locale} />

        <section className="bg-[var(--paper)]">
          <div className="mx-auto max-w-[86rem] px-5 py-18 lg:px-10 lg:py-24">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">05 · {labels.hub.eyebrow}</p>
                <h2 className="brand-h2 mt-4 max-w-3xl">{labels.hub.sectionTitle}</h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[var(--muted)] lg:justify-self-end">
                {labels.hub.sectionBody}
              </p>
            </div>
            <div className="mt-11">
              <CapabilityCards locale={locale} />
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-white">
          <div className="mx-auto grid max-w-[86rem] gap-8 px-5 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-16">
            <div>
              <p className="brand-eyebrow">TOOYEI / PROJECT QUALITY</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] text-[var(--navy)] sm:text-4xl">{labels.hub.ctaTitle}</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">{labels.hub.ctaBody}</p>
            </div>
            <Link
              href={localizedPath(locale, "/contact")}
              className="inline-flex min-h-12 items-center justify-between gap-8 bg-[var(--navy)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--navy-soft)]"
            >
              {labels.contact}<ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

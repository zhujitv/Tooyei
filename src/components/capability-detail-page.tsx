import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  capabilitiesCopy,
  capabilityMedia,
  capabilitySlugs,
  type CapabilitySlug,
} from "@/lib/capabilities";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { localizedPath, type Locale } from "@/lib/site";

export async function CapabilityDetailPage({ locale, slug }: { locale: Locale; slug: CapabilitySlug }) {
  const labels = capabilitiesCopy[locale];
  const page = labels.pages[slug];
  const media = capabilityMedia[slug];
  const categories = await getPublicCategoryTree(locale);
  const related = capabilitySlugs.filter((candidate) => candidate !== slug);

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} />
      <main>
        <section className="relative isolate min-h-[36rem] overflow-hidden bg-[var(--navy)] text-white">
          <Image src={media.hero} alt={page.title} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.97)_0%,rgba(8,17,31,0.84)_42%,rgba(8,17,31,0.18)_78%,rgba(8,17,31,0.05)_100%)] rtl:bg-[linear-gradient(270deg,rgba(8,17,31,0.97)_0%,rgba(8,17,31,0.84)_42%,rgba(8,17,31,0.18)_78%,rgba(8,17,31,0.05)_100%)]" />
          <div className="relative mx-auto flex min-h-[36rem] max-w-[86rem] flex-col justify-between px-5 py-10 lg:px-10 lg:py-12">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-white/55">
              <Link href={localizedPath(locale)} className="transition hover:text-white">{labels.home}</Link>
              <ChevronRight className="size-3 rtl:rotate-180" />
              <Link href={localizedPath(locale, "/capabilities")} className="transition hover:text-white">{labels.capabilities}</Link>
              <ChevronRight className="size-3 rtl:rotate-180" />
              <span className="text-white" aria-current="page">{page.eyebrow}</span>
            </nav>
            <div className="max-w-[46rem] pb-4">
              <p className="brand-eyebrow-light"><span />{page.eyebrow}</p>
              <h1 className="mt-6 text-[clamp(2.7rem,5.8vw,5rem)] font-medium leading-[1.01] tracking-[-0.06em]">{page.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">{page.summary}</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto grid max-w-[86rem] gap-8 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:px-10 lg:py-20">
            <div>
              <p className="brand-eyebrow">01 · TOOYEI</p>
              <h2 className="brand-h2 mt-4 max-w-xl">{page.introTitle}</h2>
            </div>
            <div className="lg:border-l lg:border-[var(--border)] lg:pl-12 rtl:lg:border-l-0 rtl:lg:border-r rtl:lg:pl-0 rtl:lg:pr-12">
              <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">{page.introBody}</p>
              <p className="mt-7 border-l-2 border-[var(--gold)] pl-5 text-sm leading-7 text-[var(--text)] rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-5">{page.note}</p>
            </div>
          </div>
        </section>

        <section className="bg-[var(--ivory)]">
          <div className="mx-auto max-w-[86rem] px-5 py-18 lg:px-10 lg:py-24">
            <p className="brand-eyebrow">02 · {page.eyebrow}</p>
            <h2 className="brand-h2 mt-4">{page.processTitle}</h2>
            <div className="mt-11 space-y-5 lg:space-y-7">
              {page.steps.map((step, index) => (
                <article key={step.title} className="grid overflow-hidden border border-[var(--border)] bg-white lg:grid-cols-2 lg:items-stretch">
                  <div className={index % 2 ? "relative min-h-72 lg:order-2 lg:min-h-[27rem]" : "relative min-h-72 lg:min-h-[27rem]"}>
                    <Image src={media.steps[index] ?? media.hero} alt={step.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  </div>
                  <div className={index % 2 ? "flex min-h-64 flex-col justify-center p-7 lg:order-1 lg:p-12" : "flex min-h-64 flex-col justify-center p-7 lg:p-12"}>
                    <p className="font-mono text-[0.67rem] font-semibold tracking-[0.18em] text-[var(--gold)]">STEP / 0{index + 1}</p>
                    <h3 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[var(--navy)]">{step.title}</h3>
                    <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--paper)]">
          <div className="mx-auto max-w-[90rem] px-5 py-18 lg:px-10 lg:py-24">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">03 · VISUAL RECORD</p>
                <h2 className="brand-h2 mt-4">{labels.gallery}</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] lg:justify-self-end">{labels.galleryBody}</p>
            </div>
            <div className="mt-10 grid auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[11rem] lg:grid-cols-4 lg:gap-3">
              {media.gallery.map((image, index) => {
                const feature = index % 7 === 0 || index % 7 === 4;
                return (
                  <figure key={image} className={feature ? "relative col-span-2 row-span-2 overflow-hidden bg-slate-200" : "relative row-span-2 overflow-hidden bg-slate-200"}>
                    <Image src={image} alt="" fill sizes={feature ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"} className="object-cover transition duration-700 hover:scale-[1.025]" />
                    <span className="absolute bottom-3 right-3 bg-[var(--navy)]/75 px-2 py-1 font-mono text-[0.58rem] tracking-[0.12em] text-white/70 backdrop-blur-sm rtl:left-3 rtl:right-auto">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--navy)] text-white">
          <div className="mx-auto max-w-[86rem] px-5 py-18 lg:px-10 lg:py-22">
            <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
              <div>
                <p className="brand-eyebrow-light"><span />{labels.capabilities}</p>
                <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">{labels.hub.sectionTitle}</h2>
              </div>
              <Link href={localizedPath(locale, "/capabilities")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/75 hover:text-[var(--gold)]">
                {labels.viewDetails}<ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {related.map((candidate) => (
                <Link key={candidate} href={localizedPath(locale, `/capabilities/${candidate}`)} className="group flex min-h-24 items-center justify-between border border-white/10 bg-white/[0.035] px-6 py-5 transition hover:border-white/25 hover:bg-white/[0.06]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">TOOYEI</p>
                    <p className="mt-2 text-xl font-medium tracking-[-0.025em]">{labels.pages[candidate].eyebrow}</p>
                  </div>
                  <ArrowUpRight className="size-5 text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

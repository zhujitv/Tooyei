import Image from "next/image";
import {
  ClipboardCheck,
  Factory,
  FileCheck2,
  PackageCheck,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import {
  capabilitiesNarrativeCopy,
  capabilityMetricValues,
  capabilityMedia,
} from "@/lib/capabilities";
import type { Locale } from "@/lib/site";

const commitmentIcons = [ClipboardCheck, ScanSearch, ShieldCheck] as const;
const deliverableIcons = [ClipboardCheck, FileCheck2, ScanSearch, PackageCheck] as const;

export function CapabilityProofSystem({ locale }: { locale: Locale }) {
  const content = capabilitiesNarrativeCopy[locale];

  return (
    <>
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[86rem] px-5 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <p className="brand-eyebrow">01 · {content.proof.eyebrow}</p>
              <h2 className="brand-h2 mt-4 max-w-3xl">{content.proof.title}</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] lg:justify-self-end">
              {content.proof.body}
            </p>
          </div>

          <div className="mt-10 grid border-y border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {content.proof.metrics.map((metric, index) => (
              <article
                key={metric.label}
                className="border-b border-[var(--border)] py-7 sm:px-6 lg:border-b-0 lg:border-r lg:px-7 lg:last:border-r-0 rtl:lg:border-l rtl:lg:border-r-0 rtl:lg:last:border-l-0"
              >
                <p className="text-[clamp(2rem,3vw,3rem)] font-medium leading-none tracking-[-0.055em] text-[var(--navy)]">
                  {capabilityMetricValues[index]}
                </p>
                <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">{metric.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{metric.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-5xl text-xs leading-5 text-[var(--muted)]">{content.proof.note}</p>
        </div>
      </section>

      <section className="bg-[var(--ivory)]">
        <div className="mx-auto grid max-w-[86rem] gap-10 px-5 py-18 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-24">
          <div className="grid min-h-[31rem] grid-cols-12 grid-rows-2 gap-3">
            <div className="relative col-span-8 row-span-2 overflow-hidden bg-slate-200">
              <Image
                src={capabilityMedia.manufacturing.card}
                alt=""
                fill
                sizes="(max-width: 1024px) 66vw, 36vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/35 to-transparent" />
              <span className="absolute bottom-4 left-4 font-mono text-[0.62rem] font-semibold tracking-[0.16em] text-white rtl:left-auto rtl:right-4">
                01 / MANUFACTURING
              </span>
            </div>
            <div className="relative col-span-4 overflow-hidden bg-slate-200">
              <Image
                src={capabilityMedia["quality-inspection"].card}
                alt=""
                fill
                sizes="(max-width: 1024px) 34vw, 18vw"
                className="object-cover"
              />
            </div>
            <div className="relative col-span-4 overflow-hidden bg-slate-200">
              <Image
                src={capabilityMedia["laboratory-testing"].card}
                alt=""
                fill
                sizes="(max-width: 1024px) 34vw, 18vw"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="brand-eyebrow">02 · {content.risk.eyebrow}</p>
            <h2 className="brand-h2 mt-4">{content.risk.title}</h2>
            <p className="mt-5 text-base leading-7 text-[var(--muted)]">{content.risk.body}</p>
            <div className="mt-8 border-y border-[var(--border)]">
              {content.risk.commitments.map((item, index) => {
                const Icon = commitmentIcons[index] ?? ShieldCheck;
                return (
                  <article key={item.title} className="grid grid-cols-[auto_1fr] gap-5 border-b border-[var(--border)] py-6 last:border-b-0">
                    <span className="grid size-11 place-items-center border border-[var(--border)] bg-white text-[var(--gold)]">
                      <Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <div>
                      <h3 className="text-lg font-medium tracking-[-0.025em] text-[var(--navy)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-[86rem] px-5 py-18 lg:px-10 lg:py-24">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="brand-eyebrow-light"><span />03 · {content.system.eyebrow}</p>
              <h2 className="brand-h2 mt-4 max-w-3xl text-white">{content.system.title}</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/58 lg:justify-self-end">{content.system.body}</p>
          </div>

          <div className="mt-11 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="grid min-h-[33rem] grid-cols-2 grid-rows-2 gap-3 lg:sticky lg:top-32">
              <div className="relative col-span-2 overflow-hidden bg-white/5">
                <Image
                  src="/media/capabilities/production/production-06.webp"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden bg-white/5">
                <Image
                  src="/media/capabilities/inspection/inspection-12.webp"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 21vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden bg-white/5">
                <Image
                  src="/media/capabilities/laboratory/laboratory-05.webp"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 21vw"
                  className="object-cover"
                />
              </div>
            </div>

            <ol className="border-t border-white/12">
              {content.system.stages.map((stage, index) => (
                <li key={stage.title} className="group grid grid-cols-[auto_1fr] gap-5 border-b border-white/12 py-6 sm:gap-7 sm:py-7">
                  <span className="font-mono text-xs tracking-[0.15em] text-[var(--gold)]">0{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-medium tracking-[-0.03em] text-white sm:text-2xl">{stage.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{stage.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[86rem] px-5 py-18 lg:px-10 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-eyebrow">04 · {content.deliverables.eyebrow}</p>
            <h2 className="brand-h2 mt-4">{content.deliverables.title}</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{content.deliverables.body}</p>
          </div>
          <div className="mt-10 grid border border-[var(--border)] bg-[var(--border)] gap-px md:grid-cols-2 lg:grid-cols-4">
            {content.deliverables.items.map((item, index) => {
              const Icon = deliverableIcons[index] ?? Factory;
              return (
                <article key={item.title} className="min-h-64 bg-white p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <Icon className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
                    <span className="font-mono text-[0.62rem] tracking-[0.16em] text-[var(--muted)]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-12 text-xl font-medium tracking-[-0.03em] text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

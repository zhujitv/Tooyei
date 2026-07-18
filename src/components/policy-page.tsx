import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { policies, type PolicyKind } from "@/config/policies";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import { localeDirection, localizedPath, siteConfig, type Locale } from "@/lib/site";

export async function PolicyPage({ kind, locale }: { kind: PolicyKind; locale: Locale }) {
  const policy = policies[locale][kind];
  const [categories, settings] = await Promise.all([getPublicCategoryTree(locale), getPublicSiteSettings()]);
  const renderBody = (body: string) =>
    body
      .replaceAll(siteConfig.email, settings.email)
      .replaceAll(siteConfig.legalName, settings.legalName);

  return (
    <div className="site-shell" dir={localeDirection(locale)}>
      <SiteHeader locale={locale} initialCategories={categories} initialSettings={settings} />
      <main>
        <section className="bg-[var(--navy)] text-white">
          <div className="mx-auto max-w-5xl px-5 py-20 lg:px-10 lg:py-28">
            <p className="brand-eyebrow-light"><span />{policy.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">{policy.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">{policy.intro}</p>
            <p className="mt-5 text-sm leading-6 text-white/45">{policy.lastUpdatedLabel}: {policy.lastUpdated}</p>
          </div>
        </section>
        <section className="bg-[var(--paper)]">
          <div className="mx-auto max-w-5xl px-5 py-16 lg:px-10 lg:py-24">
            <Link href={localizedPath(locale)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--navy)] hover:text-[var(--gold)]">
              <ArrowLeft className="size-4" />{policy.backHome}
            </Link>
            <div className="mt-10 border-t border-[var(--border)]">
              {policy.sections.map((section, index) => (
                <section key={section.title} className="grid gap-4 border-b border-[var(--border)] py-8 md:grid-cols-[5rem_0.8fr_1.2fr]">
                  <span className="font-mono text-sm tracking-[0.15em] text-[var(--gold)]">0{index + 1}</span>
                  <h2 className="text-xl font-semibold tracking-[-0.01em] text-[var(--navy)]">{section.title}</h2>
                  <p className="text-base leading-8 text-[var(--muted)]">{renderBody(section.body)}</p>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

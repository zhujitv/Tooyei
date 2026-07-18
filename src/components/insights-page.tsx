import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { safeJsonLd } from "@/lib/article-seo";
import { insightsCopy } from "@/lib/insights-copy";
import { getPublishedArticles } from "@/lib/repositories/articles";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import { localizedPath, toContentLocale, type Locale } from "@/lib/site";

export async function InsightsPage({ locale }: { locale: Locale }) {
  const labels = insightsCopy[toContentLocale(locale)];
  const [articles, categories, settings] = await Promise.all([
    getPublishedArticles(locale), getPublicCategoryTree(locale), getPublicSiteSettings(),
  ]);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: labels.seoTitle,
    description: labels.seoDescription,
    url: new URL(localizedPath(locale, "/insights"), settings.siteUrl).toString(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem", position: index + 1, name: article.title,
        url: new URL(localizedPath(locale, `/insights/${article.slug}`), settings.siteUrl).toString(),
      })),
    },
  };
  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} initialSettings={settings} />
      <main>
        <section className="site-dark-panel"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><p className="brand-eyebrow">{labels.eyebrow}</p><h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">{labels.title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-white/65">{labels.description}</p></div></section>
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="mb-9 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-5"><div><p className="brand-eyebrow">{labels.eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">{labels.latest}</h2></div><span className="text-sm text-[var(--muted)]">{articles.length}</span></div>
          {articles.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.id} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_12px_35px_rgba(8,17,31,0.05)]"><Link href={localizedPath(locale, `/insights/${article.slug}`)} className="block"><div className="relative aspect-[16/10] overflow-hidden bg-[#E9EDF1]">{article.coverImage ? <><Image src={article.coverImage} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/10" /></> : <span className="grid h-full place-items-center"><BookOpen className="size-8 text-slate-300" /></span>}</div><div className="p-5"><div className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]"><span>{labels.kinds[article.kind]}</span><span className="inline-flex items-center gap-1 text-[var(--muted)]"><Clock3 className="size-3" />{article.readingMinutes} {labels.minutes}</span></div><h3 className="mt-4 text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--navy)]">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)]">{labels.readArticle}<ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div></Link></article>)}</div> : <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center"><BookOpen className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-[var(--navy)]">{labels.emptyTitle}</p><p className="mt-2 text-sm text-[var(--muted)]">{labels.emptyBody}</p></div>}
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }} />
      <SiteFooter locale={locale} />
    </div>
  );
}

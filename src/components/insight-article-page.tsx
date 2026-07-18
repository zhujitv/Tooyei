import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Languages } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildArticleBreadcrumbJsonLd, buildArticleJsonLd, safeJsonLd } from "@/lib/article-seo";
import { insightsCopy } from "@/lib/insights-copy";
import { getPublishedArticleBySlug, getPublishedArticles } from "@/lib/repositories/articles";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import { localizedPath, toContentLocale, type Locale } from "@/lib/site";

export async function InsightArticlePage({ locale, slug }: { locale: Locale; slug: string }) {
  const labels = insightsCopy[toContentLocale(locale)];
  const [article, categories, settings, articles] = await Promise.all([
    getPublishedArticleBySlug(slug, locale), getPublicCategoryTree(locale), getPublicSiteSettings(), getPublishedArticles(locale),
  ]);
  if (!article) notFound();
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });
  const path = localizedPath(article.hasExactTranslation ? locale : article.resolvedLocale, `/insights/${article.slug}`);
  const articleJsonLd = buildArticleJsonLd({
    siteUrl: settings.siteUrl, siteName: settings.siteName, legalName: settings.legalName, locale: article.resolvedLocale,
    path, title: article.title, description: article.seoDescription || article.excerpt, coverImage: article.coverImage,
    authorName: article.authorName, publishedAt: article.publishedAt, updatedAt: article.updatedAt,
  });
  const breadcrumbJsonLd = buildArticleBreadcrumbJsonLd({
    siteUrl: settings.siteUrl, localePath: localizedPath(locale, "/insights"), insightsLabel: labels.eyebrow, title: article.title,
  });
  const related = articles.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} initialSettings={settings} />
      <main>
        <article>
          <header className="site-dark-panel relative overflow-hidden">
            {article.coverImage ? <><Image src={article.coverImage} alt="" fill priority sizes="100vw" className="object-cover opacity-20" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-slate-950/10" /></> : null}
            <div className="relative mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24"><Link href={localizedPath(locale, "/insights")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"><ArrowLeft className="size-4" />{labels.back}</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">{labels.kinds[article.kind]}</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-white sm:text-6xl">{article.title}</h1><p className="mt-6 max-w-3xl text-base leading-8 text-white/68">{article.excerpt}</p><div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50"><span className="inline-flex items-center gap-2"><CalendarDays className="size-3.5" />{labels.published} {dateFormatter.format(article.publishedAt)}</span><span className="inline-flex items-center gap-2"><Clock3 className="size-3.5" />{article.readingMinutes} {labels.minutes}</span>{article.authorName ? <span>{article.authorName}</span> : null}</div></div>
          </header>

          <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
            {!article.hasExactTranslation ? <div className="mb-9 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><Languages className="mt-1 size-4 shrink-0" /><p>{labels.fallbackNotice}</p></div> : null}
            <div className="article-prose">
              {article.content.blocks.map((block) => {
                if (block.type === "image" && block.url) return (
                  <figure key={block.id} className="article-media-block">
                    <div className="relative overflow-hidden rounded-xl bg-slate-100" style={{ aspectRatio: `${block.width || 16}/${block.height || 9}` }}>
                      <Image src={block.url} alt={block.alt || article.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
                    </div>
                    {block.caption ? <figcaption>{block.caption}</figcaption> : null}
                  </figure>
                );
                if (block.type === "heading") return block.level === 3 ? <h3 key={block.id}>{block.text}</h3> : <h2 key={block.id}>{block.text}</h2>;
                if (block.type === "quote") return <blockquote key={block.id}>{block.text}</blockquote>;
                if (block.type === "list") return <ul key={block.id}>{block.text.split("\n").filter(Boolean).map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}</ul>;
                return <p key={block.id}>{block.text}</p>;
              })}
            </div>
            <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]"><span>{labels.updated} {dateFormatter.format(article.updatedAt)}</span><Link href={localizedPath(locale, "/contact")} className="inline-flex items-center gap-2 font-semibold text-[var(--navy)]">Contact TOOYEI<ArrowUpRight className="size-3.5" /></Link></footer>
          </div>
        </article>

        {related.length ? <section className="border-t border-[var(--border)] bg-[var(--ivory)]"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="mb-8 flex items-end justify-between"><div><p className="brand-eyebrow">{labels.eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">{labels.latest}</h2></div><Link href={localizedPath(locale, "/insights")} className="text-sm font-semibold text-[var(--navy)]">{labels.back}</Link></div><div className="grid gap-4 md:grid-cols-3">{related.map((item) => <Link key={item.id} href={localizedPath(locale, `/insights/${item.slug}`)} className="rounded-xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[var(--gold)]">{labels.kinds[item.kind]}</p><h3 className="mt-3 text-lg font-semibold leading-6 text-[var(--navy)]">{item.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{item.excerpt}</p></Link>)}</div></div></section> : null}
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <SiteFooter locale={locale} />
    </div>
  );
}

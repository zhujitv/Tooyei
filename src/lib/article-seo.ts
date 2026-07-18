export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function resolveSeoUrl(value: string | null | undefined, siteUrl: string) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, siteUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildArticleJsonLd(input: {
  siteUrl: string;
  siteName: string;
  legalName: string;
  locale: string;
  path: string;
  title: string;
  description: string;
  coverImage?: string | null;
  authorName?: string | null;
  publishedAt: Date;
  updatedAt: Date;
}) {
  const url = new URL(input.path, input.siteUrl).toString();
  const image = resolveSeoUrl(input.coverImage, input.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    inLanguage: input.locale,
    mainEntityOfPage: url,
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    ...(image ? { image: [image] } : {}),
    author: { "@type": input.authorName ? "Person" : "Organization", name: input.authorName || input.legalName },
    publisher: {
      "@type": "Organization",
      name: input.legalName,
      url: input.siteUrl,
      logo: { "@type": "ImageObject", url: new URL("/brand/tooyei-logo.png", input.siteUrl).toString() },
    },
  };
}

export function buildArticleBreadcrumbJsonLd(input: {
  siteUrl: string;
  localePath: string;
  insightsLabel: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: input.insightsLabel, item: new URL(input.localePath, input.siteUrl).toString() },
      { "@type": "ListItem", position: 2, name: input.title },
    ],
  };
}

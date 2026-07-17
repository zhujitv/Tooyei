/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronRight, Layers, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product, ProductMediaItem } from "@/lib/content";
import { copy, readLocalizedText } from "@/lib/content";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { localizedPath, toContentLocale, type ContentLocale, type Locale } from "@/lib/site";

const downloadKindLabel: Record<string, Record<ContentLocale, string>> = {
  CATALOG: { en: "Catalogue", de: "Katalog", fr: "Catalogue", es: "Catálogo", ru: "Каталог", ja: "カタログ", it: "Catalogo", ar: "الكتالوج", zh: "产品目录" },
  SPEC_SHEET: { en: "Spec sheet", de: "Datenblatt", fr: "Fiche technique", es: "Ficha técnica", ru: "Спецификация", ja: "仕様書", it: "Scheda tecnica", ar: "ورقة المواصفات", zh: "规格表" },
  INSTALLATION_GUIDE: { en: "Installation guide", de: "Verlegeanleitung", fr: "Guide d’installation", es: "Guía de instalación", ru: "Инструкция по монтажу", ja: "施工ガイド", it: "Guida all’installazione", ar: "دليل التركيب", zh: "安装指南" },
  WARRANTY: { en: "Warranty", de: "Garantie", fr: "Garantie", es: "Garantía", ru: "Гарантия", ja: "保証書", it: "Garanzia", ar: "الضمان", zh: "质保文件" },
  CERTIFICATE: { en: "Certificate", de: "Zertifikat", fr: "Certificat", es: "Certificado", ru: "Сертификат", ja: "認証書", it: "Certificato", ar: "الشهادة", zh: "认证证书" },
  OTHER: { en: "Download", de: "Download", fr: "Téléchargement", es: "Descarga", ru: "Материал", ja: "資料", it: "Download", ar: "تنزيل", zh: "资料" },
};

const sectionCopy: Record<ContentLocale, Record<string, string>> = {
  zh: {
    advantages: "核心卖点",
    specs: "产品参数",
    applications: "应用场景",
    downloads: "下载资料",
    gallery: "产品图库",
    breadcrumb: "面包屑",
    home: "首页",
  },
  en: {
    advantages: "Key advantages",
    specs: "Specifications",
    applications: "Applications",
    downloads: "Downloads",
    gallery: "Product gallery",
    breadcrumb: "Breadcrumb",
    home: "Home",
  },
  de: {
    advantages: "Vorteile",
    specs: "Spezifikationen",
    applications: "Anwendungen",
    downloads: "Downloads",
    gallery: "Produktgalerie",
    breadcrumb: "Brotkrümelnavigation",
    home: "Startseite",
  },
  fr: {
    advantages: "Avantages clés",
    specs: "Spécifications",
    applications: "Applications",
    downloads: "Téléchargements",
    gallery: "Galerie produit",
    breadcrumb: "Fil d’Ariane",
    home: "Accueil",
  },
  es: {
    advantages: "Ventajas clave",
    specs: "Especificaciones",
    applications: "Aplicaciones",
    downloads: "Descargas",
    gallery: "Galería de producto",
    breadcrumb: "Migas de pan",
    home: "Inicio",
  },
  ru: {
    advantages: "Ключевые преимущества",
    specs: "Характеристики",
    applications: "Применение",
    downloads: "Материалы",
    gallery: "Галерея продукта",
    breadcrumb: "Навигационная цепочка",
    home: "Главная",
  },
  ja: {
    advantages: "主な特長",
    specs: "製品仕様",
    applications: "用途",
    downloads: "ダウンロード",
    gallery: "製品ギャラリー",
    breadcrumb: "パンくずリスト",
    home: "ホーム",
  },
  it: {
    advantages: "Vantaggi principali",
    specs: "Specifiche",
    applications: "Applicazioni",
    downloads: "Download",
    gallery: "Galleria prodotto",
    breadcrumb: "Percorso di navigazione",
    home: "Home",
  },
  ar: {
    advantages: "المزايا الرئيسية",
    specs: "المواصفات",
    applications: "التطبيقات",
    downloads: "التنزيلات",
    gallery: "معرض المنتج",
    breadcrumb: "مسار التنقل",
    home: "الرئيسية",
  },
};

function ProductVisual({ media, locale, priority = false }: { media: ProductMediaItem; locale: Locale; priority?: boolean }) {
  const alt = media.altLocalized ? readLocalizedText(media.altLocalized, locale) || media.alt : media.alt;
  if (media.url.startsWith("/")) {
    return (
      <Image
        src={media.url}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    );
  }

  return <img src={media.url} alt={alt} className="size-full object-cover" loading={priority ? "eager" : "lazy"} />;
}

export async function ProductPage({ product, locale }: { product: Product; locale: Locale }) {
  const contentLocale = toContentLocale(locale);
  const t = copy[contentLocale];
  const labels = sectionCopy[contentLocale];
  const categories = await getPublicCategoryTree(locale);
  const contactHref = `${localizedPath(locale, "/contact")}?product=${encodeURIComponent(product.slug)}`;
  const productTitle = readLocalizedText(product.title, locale);
  const productSummary = readLocalizedText(product.summary, locale);
  const fallbackMedia: ProductMediaItem = {
    url: product.image,
    alt: `${product.sku} ${productTitle}`,
    role: "PRIMARY",
  };
  const media = product.media?.length ? product.media : [fallbackMedia];
  const primaryMedia = media.find((item) => item.role === "PRIMARY") ?? media[0] ?? fallbackMedia;
  const gallery = media.filter((item) => item.url !== primaryMedia.url).slice(0, 6);
  const hasFeatureDescriptions = product.features.some((feature) => feature.description && readLocalizedText(feature.description, locale));

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} />
      <main>
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
          <nav aria-label={labels.breadcrumb} className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
            <Link href={localizedPath(locale)}>{labels.home}</Link>
            <ChevronRight className="size-3" />
            <Link href={localizedPath(locale, "/products")}>{t.products}</Link>
            {product.primaryCategory ? (
              <>
                <ChevronRight className="size-3" />
                {product.primaryCategory.parent ? (
                  <>
                    <Link href={localizedPath(locale, `/products/${product.primaryCategory.parent.slug}`)}>{readLocalizedText(product.primaryCategory.parent.name, locale)}</Link>
                    <ChevronRight className="size-3" />
                  </>
                ) : null}
                <Link href={localizedPath(locale, `/products/${product.primaryCategory.slug}`)} aria-current="page" className="font-medium text-[var(--text)]">{readLocalizedText(product.primaryCategory.name, locale)}</Link>
              </>
            ) : null}
          </nav>
          <Button asChild variant="ghost" className="-ml-3 mb-7">
            <Link href={localizedPath(locale, "/products")}>
              <ArrowLeft />
              {t.products}
            </Link>
          </Button>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#e7eaf0] shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                <ProductVisual media={primaryMedia} locale={locale} priority />
              </div>
              {gallery.length ? (
                <div>
                  <p className="mb-3 text-xs font-bold tracking-[0.16em] text-muted-foreground">{labels.gallery}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map((item) => (
                      <div key={`${item.role}-${item.url}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#e7eaf0]">
                        <ProductVisual media={item} locale={locale} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:pt-8">
              <div className="flex items-center gap-3">
                <Badge>{product.primaryCategory ? readLocalizedText(product.primaryCategory.name, locale) : product.category}</Badge>
                <span className="brand-eyebrow">{product.sku}</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{productTitle}</h1>
              <p className="mt-6 text-base leading-7 text-muted-foreground">{productSummary}</p>

              {product.features.length ? (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold">{labels.advantages}</h2>
                  <div className={hasFeatureDescriptions ? "mt-4 grid gap-4" : "mt-4 grid gap-3 sm:grid-cols-2"}>
                    {product.features.map((feature) => (
                      <div
                        key={feature.zh || feature.en}
                        className={
                          hasFeatureDescriptions
                            ? "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            : "flex items-center gap-2 text-sm font-medium"
                        }
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#b68a4c]/15 text-[#8a6530]">
                            <Check className="size-3.5" />
                          </span>
                          {readLocalizedText(feature, locale)}
                        </div>
                        {feature.description && readLocalizedText(feature.description, locale) ? (
                          <p className="mt-2 pl-8 text-base leading-7 text-muted-foreground">{readLocalizedText(feature.description, locale)}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <Separator className="my-9" />

              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Layers className="size-5 text-[#b68a4c]" />
                  {labels.specs}
                </h2>
                <dl className="mt-5 divide-y divide-black/8 border-y border-black/8">
                  {product.specifications.map((item) => (
                    <div key={`${item.group}-${item.label.zh}-${item.value}`} className="grid gap-2 py-4 text-sm sm:grid-cols-[180px_1fr]">
                      <dt>
                        {item.group || item.groupLocalized ? <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.groupLocalized ? readLocalizedText(item.groupLocalized, locale) || item.group : item.group}</p> : null}
                        <span className="text-muted-foreground">{readLocalizedText(item.label, locale)}</span>
                      </dt>
                      <dd className="font-medium">
                        {item.displayValue ? readLocalizedText(item.displayValue, locale) || item.value : item.value}
                        {item.unit ? <span className="ml-1 text-muted-foreground">{item.unit}</span> : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Button asChild size="lg" className="mt-10 site-primary-button">
                <Link href={contactHref}>
                  {t.discuss}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {product.applications?.length ? (
          <section className="border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
              <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.03em]">
                <MapPin className="size-6 text-[#b68a4c]" />
                {labels.applications}
              </h2>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {product.applications.map((application) => (
                  <Card key={application.title.zh || application.title.en} className="overflow-hidden rounded-3xl border-slate-200 shadow-none">
                    {application.image ? (
                      <div className="relative aspect-[4/3] bg-[#e7eaf0]">
                        <ProductVisual
                          media={{
                            url: application.image,
                            alt: application.imageAlt || readLocalizedText(application.title, locale),
                            altLocalized: application.imageAltLocalized,
                            role: "APPLICATION",
                          }}
                          locale={locale}
                        />
                      </div>
                    ) : null}
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold">{readLocalizedText(application.title, locale)}</h3>
                      <p className="mt-3 text-base leading-7 text-muted-foreground">{readLocalizedText(application.description, locale)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {product.downloads?.length ? (
          <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <div className="site-dark-panel rounded-3xl p-6 lg:p-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{labels.downloads}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {product.downloads.map((download) => (
                  <a
                    key={`${download.kind}-${download.url}`}
                    href={download.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#d6b36a]/50 hover:bg-white/10"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6b36a]">
                      {downloadKindLabel[download.kind]?.[contentLocale] ?? downloadKindLabel.OTHER[contentLocale]}
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{readLocalizedText(download.title, locale)}</h3>
                        {download.description && readLocalizedText(download.description, locale) ? (
                          <p className="mt-2 text-base leading-7 text-white/55">{readLocalizedText(download.description, locale)}</p>
                        ) : null}
                      </div>
                      <ArrowDownToLine className="size-5 shrink-0 text-white/45" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

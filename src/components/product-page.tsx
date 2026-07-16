/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, Layers, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product, ProductMediaItem } from "@/lib/content";
import { copy } from "@/lib/content";
import { localizedPath, type Locale } from "@/lib/site";

const downloadKindLabel: Record<string, Record<Locale, string>> = {
  CATALOG: { zh: "产品目录", en: "Catalogue", es: "Catálogo", de: "Katalog" },
  SPEC_SHEET: { zh: "规格表", en: "Spec sheet", es: "Ficha técnica", de: "Datenblatt" },
  INSTALLATION_GUIDE: { zh: "安装指南", en: "Installation guide", es: "Guía de instalación", de: "Verlegeanleitung" },
  WARRANTY: { zh: "质保文件", en: "Warranty", es: "Garantía", de: "Garantie" },
  CERTIFICATE: { zh: "认证证书", en: "Certificate", es: "Certificado", de: "Zertifikat" },
  OTHER: { zh: "资料", en: "Download", es: "Descarga", de: "Download" },
};

const sectionCopy: Record<Locale, Record<string, string>> = {
  zh: {
    advantages: "核心卖点",
    specs: "产品参数",
    applications: "应用场景",
    downloads: "下载资料",
    gallery: "产品图库",
  },
  en: {
    advantages: "Key advantages",
    specs: "Specifications",
    applications: "Applications",
    downloads: "Downloads",
    gallery: "Product gallery",
  },
  es: {
    advantages: "Ventajas clave",
    specs: "Especificaciones",
    applications: "Aplicaciones",
    downloads: "Descargas",
    gallery: "Galería de producto",
  },
  de: {
    advantages: "Vorteile",
    specs: "Spezifikationen",
    applications: "Anwendungen",
    downloads: "Downloads",
    gallery: "Produktgalerie",
  },
};

function ProductVisual({ media, priority = false }: { media: ProductMediaItem; priority?: boolean }) {
  if (media.url.startsWith("/")) {
    return (
      <Image
        src={media.url}
        alt={media.alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    );
  }

  return <img src={media.url} alt={media.alt} className="size-full object-cover" loading={priority ? "eager" : "lazy"} />;
}

export function ProductPage({ product, locale }: { product: Product; locale: Locale }) {
  const t = copy[locale];
  const labels = sectionCopy[locale];
  const contactHref = `${localizedPath(locale, "/contact")}?product=${encodeURIComponent(product.slug)}`;
  const fallbackMedia: ProductMediaItem = {
    url: product.image,
    alt: `${product.sku} ${product.title[locale]}`,
    role: "PRIMARY",
  };
  const media = product.media?.length ? product.media : [fallbackMedia];
  const primaryMedia = media.find((item) => item.role === "PRIMARY") ?? media[0] ?? fallbackMedia;
  const gallery = media.filter((item) => item.url !== primaryMedia.url).slice(0, 6);
  const hasFeatureDescriptions = product.features.some((feature) => feature.description?.[locale]);

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
          <Button asChild variant="ghost" className="-ml-3 mb-7">
            <Link href={localizedPath(locale, "/products")}>
              <ArrowLeft />
              {t.products}
            </Link>
          </Button>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#e7eaf0] shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                <ProductVisual media={primaryMedia} priority />
              </div>
              {gallery.length ? (
                <div>
                  <p className="mb-3 text-xs font-bold tracking-[0.16em] text-muted-foreground">{labels.gallery}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map((item) => (
                      <div key={`${item.role}-${item.url}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#e7eaf0]">
                        <ProductVisual media={item} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:pt-8">
              <div className="flex items-center gap-3">
                <Badge>{product.category}</Badge>
                <span className="brand-eyebrow">{product.sku}</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{product.title[locale]}</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{product.summary[locale]}</p>

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
                          {feature[locale]}
                        </div>
                        {feature.description?.[locale] ? (
                          <p className="mt-2 pl-8 text-sm leading-6 text-muted-foreground">{feature.description[locale]}</p>
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
                        {item.group ? <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.group}</p> : null}
                        <span className="text-muted-foreground">{item.label[locale]}</span>
                      </dt>
                      <dd className="font-medium">
                        {item.value}
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
                            alt: application.imageAlt || application.title[locale],
                            role: "APPLICATION",
                          }}
                        />
                      </div>
                    ) : null}
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold">{application.title[locale]}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{application.description[locale]}</p>
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
                      {downloadKindLabel[download.kind]?.[locale] ?? downloadKindLabel.OTHER[locale]}
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{download.title[locale]}</h3>
                        {download.description?.[locale] ? (
                          <p className="mt-2 text-sm leading-6 text-white/55">{download.description[locale]}</p>
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

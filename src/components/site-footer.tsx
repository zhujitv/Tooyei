import Link from "next/link";
import { ArrowUpRight, Globe2, Mail, MapPin, Phone } from "lucide-react";
import { copy } from "@/lib/content";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";

const footerCopy: Record<
  Locale,
  {
    eyebrow: string;
    headline: string;
    body: string;
    start: string;
    direct: string;
    collections: string;
    company: string;
    contact: string;
    allProducts: string;
    globalBusiness: string;
    factoryDirect: string;
    oemReady: string;
    exportFocused: string;
    closing: string;
  }
> = {
  zh: {
    eyebrow: "为全球市场制造",
    headline: "从产品开发，到稳定交付。",
    body: "面向地板进口商、经销商、工程承包商和品牌客户，提供可靠的产品体系、灵活定制与成熟出口支持。",
    start: "开始项目咨询",
    direct: "直接联系",
    collections: "产品系列",
    company: "公司与服务",
    contact: "联系信息",
    allProducts: "浏览全部产品",
    globalBusiness: "全球批发与工程采购",
    factoryDirect: "工厂直供",
    oemReady: "支持 OEM",
    exportFocused: "专注出口",
    closing: "为全球批发、工程与品牌客户提供地板解决方案",
  },
  en: {
    eyebrow: "Made for global markets",
    headline: "From product development to dependable delivery.",
    body: "Reliable flooring systems, flexible customization and experienced export support for importers, distributors, contractors and private-label brands.",
    start: "Start a project",
    direct: "Direct contact",
    collections: "Collections",
    company: "Company & service",
    contact: "Contact",
    allProducts: "Explore all products",
    globalBusiness: "Global wholesale & projects",
    factoryDirect: "Factory direct",
    oemReady: "OEM ready",
    exportFocused: "Export focused",
    closing: "Flooring solutions for global wholesale, projects and private-label brands",
  },
  es: {
    eyebrow: "Fabricado para mercados globales",
    headline: "Del desarrollo del producto a una entrega fiable.",
    body: "Sistemas de suelos fiables, personalización flexible y soporte de exportación para importadores, distribuidores, contratistas y marcas privadas.",
    start: "Iniciar un proyecto",
    direct: "Contacto directo",
    collections: "Colecciones",
    company: "Empresa y servicio",
    contact: "Contacto",
    allProducts: "Ver todos los productos",
    globalBusiness: "Mayoristas y proyectos globales",
    factoryDirect: "Directo de fábrica",
    oemReady: "Preparado para OEM",
    exportFocused: "Enfoque exportador",
    closing: "Soluciones de suelos para mayoristas, proyectos y marcas privadas",
  },
  de: {
    eyebrow: "Für globale Märkte gefertigt",
    headline: "Von der Produktentwicklung bis zur zuverlässigen Lieferung.",
    body: "Zuverlässige Bodensysteme, flexible Anpassung und erfahrene Exportunterstützung für Importeure, Händler, Bauunternehmen und Eigenmarken.",
    start: "Projekt starten",
    direct: "Direkter Kontakt",
    collections: "Kollektionen",
    company: "Unternehmen & Service",
    contact: "Kontakt",
    allProducts: "Alle Produkte entdecken",
    globalBusiness: "Globaler Großhandel & Projekte",
    factoryDirect: "Direkt ab Werk",
    oemReady: "OEM-fähig",
    exportFocused: "Exportorientiert",
    closing: "Bodenlösungen für Großhandel, Projekte und Eigenmarken weltweit",
  },
};

const collections = ["SPC Flooring", "WPC Flooring", "LVT Flooring", "Laminate Flooring"];

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const labels = footerCopy[locale];
  const companyLinks = [
    { label: t.company, href: "/#company" },
    { label: t.oem, href: "/#oem" },
    { label: t.resources, href: "/#resources" },
    { label: t.contact, href: "/contact" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#06101f] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_78%_12%,rgba(182,138,76,0.16),transparent_38%)]"
      />

      <div className="relative mx-auto max-w-[90rem] px-5 lg:px-10">
        <div className="grid gap-10 border-b border-white/10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#c8a66a]">{labels.eyebrow}</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-[4rem]">
              {labels.headline}
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">{labels.body}</p>
          </div>

          <div className="lg:justify-self-end">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">{labels.direct}</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="group mt-3 flex items-center gap-3 text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl"
            >
              {siteConfig.email}
              <ArrowUpRight className="size-5 text-[#c8a66a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <Link
              href={localizedPath(locale, "/contact")}
              className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-[#bd9351] px-6 text-sm font-bold text-[#06101f] transition hover:bg-[#d0ab6d]"
            >
              {labels.start}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <Link href={localizedPath(locale)} className="inline-flex items-center gap-4" aria-label="Tooyei">
              <span className="site-brand-mark site-brand-mark-dark size-14 text-xs">TY</span>
              <span>
                <span className="block text-xl font-black tracking-[0.2em]">TOOYEI</span>
                <span className="mt-1.5 block text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white/35">
                  Flooring Systems
                </span>
              </span>
            </Link>
            <p className="mt-7 max-w-sm text-sm leading-7 text-white/45">{labels.globalBusiness}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[labels.factoryDirect, labels.oemReady, labels.exportFocused].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[0.65rem] font-semibold text-white/55">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">{labels.collections}</p>
            <div className="mt-6 space-y-4">
              {collections.map((label) => (
                <Link key={label} href={localizedPath(locale, "/products")} className="group flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
                  <span className="h-px w-0 bg-[#c8a66a] transition-all group-hover:w-4" />
                  {label}
                </Link>
              ))}
              <Link href={localizedPath(locale, "/products")} className="inline-flex items-center gap-2 pt-2 text-xs font-bold text-[#d4b67d] transition hover:text-[#ecd39f]">
                {labels.allProducts}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">{labels.company}</p>
            <div className="mt-6 space-y-4">
              {companyLinks.map(({ label, href }) => (
                <Link key={href} href={localizedPath(locale, href)} className="group flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
                  <span className="h-px w-0 bg-[#c8a66a] transition-all group-hover:w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">{labels.contact}</p>
            <div className="mt-6 space-y-5 text-sm text-white/55">
              <a className="flex items-start gap-3 transition hover:text-white" href={`mailto:${siteConfig.email}`}>
                <Mail className="mt-0.5 size-4 shrink-0 text-[#c8a66a]" />
                {siteConfig.email}
              </a>
              <a className="flex items-start gap-3 transition hover:text-white" href={`tel:${siteConfig.phone.replaceAll(" ", "")}`}>
                <Phone className="mt-0.5 size-4 shrink-0 text-[#c8a66a]" />
                {siteConfig.phone}
              </a>
              <a className="flex items-start gap-3 transition hover:text-white" href={siteConfig.whatsapp} target="_blank" rel="noreferrer">
                <Globe2 className="mt-0.5 size-4 shrink-0 text-[#c8a66a]" />
                WhatsApp
              </a>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#c8a66a]" />
                {locale === "zh" ? t.location : "Changzhou, Jiangsu, China"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[0.65rem] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.legalName}</p>
          <p className="uppercase tracking-[0.14em]">{labels.closing}</p>
        </div>
      </div>
    </footer>
  );
}

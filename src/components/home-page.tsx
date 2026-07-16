import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Factory,
  FileText,
  Globe2,
  Layers3,
  MessageCircle,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { getPublishedProducts } from "@/lib/repositories/products";
import { localizedPath, type Locale } from "@/lib/site";

const editorialCopy: Record<
  Locale,
  {
    collectionEyebrow: string;
    collectionTitle: string;
    collectionBody: string;
    collectionAction: string;
    applicationsEyebrow: string;
    applicationsTitle: string;
    applicationsBody: string;
    applications: string[];
    processEyebrow: string;
    processTitle: string;
    processBody: string;
    process: Array<[string, string]>;
    resourcesEyebrow: string;
    resourcesTitle: string;
    resourcesBody: string;
    resourceCards: Array<[string, string]>;
    start: string;
    designLabel: string;
    performanceLabel: string;
    deliveryLabel: string;
  }
> = {
  zh: {
    collectionEyebrow: "从材质出发",
    collectionTitle: "每一种空间，都有合适的地板系统。",
    collectionBody: "从刚性芯层到舒适静音，从自然木纹到建筑感石纹，以清晰的产品系列帮助采购与设计团队快速决策。",
    collectionAction: "浏览系列",
    applicationsEyebrow: "面向真实项目",
    applicationsTitle: "设计表现与工程性能，不必二选一。",
    applicationsBody: "围绕住宅、酒店、零售、办公与多户住宅开发，平衡视觉、耐久、安装和维护需求。",
    applications: ["住宅与公寓", "酒店与餐饮", "零售与展厅", "办公与公共空间"],
    processEyebrow: "OEM / ODM 项目协作",
    processTitle: "从产品简报到批量交付，路径清楚。",
    processBody: "把颜色、结构、锁扣、底垫、包装和市场标准转化为可执行的产品方案。",
    process: [["明确需求", "市场、应用、价格带与目标规格"], ["匹配产品", "结构、花色、表面与锁扣方案"], ["样品确认", "实物效果、技术数据与包装核对"], ["生产交付", "质量检验、出口包装与装运协同"]],
    resourcesEyebrow: "专业采购支持",
    resourcesTitle: "让采购资料和项目沟通更高效。",
    resourcesBody: "产品参数、样品计划和 OEM 需求由同一团队协调，减少跨环节信息损耗。",
    resourceCards: [["产品目录", "按系统、花色和应用筛选"], ["技术资料", "规格、结构与性能信息"], ["样品计划", "围绕目标市场安排样品"]],
    start: "提交项目需求",
    designLabel: "设计表达",
    performanceLabel: "工程性能",
    deliveryLabel: "稳定交付",
  },
  en: {
    collectionEyebrow: "Material-led collections",
    collectionTitle: "A flooring system for every kind of space.",
    collectionBody: "From rigid performance to quiet comfort, and natural timber character to architectural stone, our collections help sourcing and design teams decide with clarity.",
    collectionAction: "Explore collection",
    applicationsEyebrow: "Made for real projects",
    applicationsTitle: "Design expression and technical performance, working together.",
    applicationsBody: "Developed for residential, hospitality, retail, workplace and multi-family projects where appearance, durability, installation and care all matter.",
    applications: ["Residential & apartments", "Hospitality & dining", "Retail & showrooms", "Workplace & public space"],
    processEyebrow: "OEM / ODM collaboration",
    processTitle: "A clear path from product brief to delivery.",
    processBody: "We turn colour, construction, locking, backing, packaging and market standards into an actionable flooring programme.",
    process: [["Define the brief", "Market, application, price point and specification"], ["Engineer the product", "Construction, decor, texture and locking options"], ["Approve samples", "Physical finish, technical data and packaging"], ["Produce & deliver", "Quality control, export packing and shipment"]],
    resourcesEyebrow: "Professional sourcing support",
    resourcesTitle: "Better product information. Faster project conversations.",
    resourcesBody: "Specifications, samples and OEM requirements are coordinated by one team, reducing friction from brief to order.",
    resourceCards: [["Product catalogue", "Browse by system, decor and application"], ["Technical data", "Construction and performance information"], ["Sample planning", "Samples selected for your target market"]],
    start: "Send your project brief",
    designLabel: "Design expression",
    performanceLabel: "Technical performance",
    deliveryLabel: "Dependable delivery",
  },
  es: {
    collectionEyebrow: "Colecciones basadas en materiales",
    collectionTitle: "Un sistema de suelo para cada tipo de espacio.",
    collectionBody: "Desde núcleos rígidos hasta confort acústico, y desde madera natural hasta piedra arquitectónica, nuestras colecciones facilitan decisiones claras.",
    collectionAction: "Explorar colección",
    applicationsEyebrow: "Creado para proyectos reales",
    applicationsTitle: "Diseño y rendimiento técnico trabajando juntos.",
    applicationsBody: "Para proyectos residenciales, hoteleros, comerciales y de oficinas donde importan la estética, durabilidad, instalación y mantenimiento.",
    applications: ["Viviendas y apartamentos", "Hoteles y restauración", "Retail y showrooms", "Oficinas y espacios públicos"],
    processEyebrow: "Colaboración OEM / ODM",
    processTitle: "Un camino claro desde el briefing hasta la entrega.",
    processBody: "Convertimos color, estructura, cierre, base, embalaje y normas de mercado en un programa de producto ejecutable.",
    process: [["Definir el briefing", "Mercado, uso, precio y especificación"], ["Diseñar el producto", "Estructura, diseño, textura y cierre"], ["Aprobar muestras", "Acabado, datos técnicos y embalaje"], ["Producir y entregar", "Control de calidad, embalaje y envío"]],
    resourcesEyebrow: "Soporte profesional",
    resourcesTitle: "Mejor información. Conversaciones más rápidas.",
    resourcesBody: "Especificaciones, muestras y requisitos OEM coordinados por un solo equipo.",
    resourceCards: [["Catálogo", "Por sistema, diseño y aplicación"], ["Datos técnicos", "Estructura y rendimiento"], ["Plan de muestras", "Selección para su mercado"]],
    start: "Enviar briefing",
    designLabel: "Expresión de diseño",
    performanceLabel: "Rendimiento técnico",
    deliveryLabel: "Entrega fiable",
  },
  de: {
    collectionEyebrow: "Materialorientierte Kollektionen",
    collectionTitle: "Ein Bodensystem für jede Art von Raum.",
    collectionBody: "Von starrer Leistung bis zu ruhigem Komfort, von natürlichem Holz bis zu architektonischem Stein – für klare Entscheidungen in Planung und Einkauf.",
    collectionAction: "Kollektion entdecken",
    applicationsEyebrow: "Für reale Projekte",
    applicationsTitle: "Design und technische Leistung im Zusammenspiel.",
    applicationsBody: "Für Wohnen, Hospitality, Retail und Arbeitswelten, in denen Optik, Haltbarkeit, Verlegung und Pflege gleichermaßen zählen.",
    applications: ["Wohnen & Apartments", "Hotels & Gastronomie", "Retail & Showrooms", "Arbeits- & öffentliche Räume"],
    processEyebrow: "OEM / ODM Zusammenarbeit",
    processTitle: "Ein klarer Weg vom Produktbriefing zur Lieferung.",
    processBody: "Wir übersetzen Farbe, Aufbau, Verriegelung, Unterlage, Verpackung und Marktstandards in ein umsetzbares Produktprogramm.",
    process: [["Briefing definieren", "Markt, Nutzung, Preis und Spezifikation"], ["Produkt entwickeln", "Aufbau, Dekor, Textur und Verriegelung"], ["Muster freigeben", "Oberfläche, Daten und Verpackung"], ["Produzieren & liefern", "Qualität, Exportverpackung und Versand"]],
    resourcesEyebrow: "Professioneller Einkaufssupport",
    resourcesTitle: "Bessere Daten. Schnellere Projektgespräche.",
    resourcesBody: "Spezifikationen, Muster und OEM-Anforderungen werden von einem Team koordiniert.",
    resourceCards: [["Produktkatalog", "Nach System, Dekor und Anwendung"], ["Technische Daten", "Aufbau und Leistungswerte"], ["Musterplanung", "Auswahl für Ihren Zielmarkt"]],
    start: "Projektbriefing senden",
    designLabel: "Designausdruck",
    performanceLabel: "Technische Leistung",
    deliveryLabel: "Zuverlässige Lieferung",
  },
};

const collectionCards = [
  { name: "SPC Rigid Core", image: "/media/product-eir-spc.jpg", detail: { zh: "防水 · 稳定 · 锁扣", en: "Waterproof · Stable · Click", es: "Impermeable · Estable · Click", de: "Wasserfest · Stabil · Klick" } },
  { name: "WPC Comfort", image: "/media/product-wpc.jpg", detail: { zh: "静音 · 温润 · 舒适", en: "Quiet · Warm · Resilient", es: "Silencioso · Cálido · Cómodo", de: "Leise · Warm · Komfortabel" } },
  { name: "LVT Design", image: "/media/product-lvt.jpg", detail: { zh: "灵活 · 精致 · 工程适用", en: "Versatile · Refined · Project-ready", es: "Versátil · Refinado · Profesional", de: "Vielseitig · Fein · Projektbereit" } },
  { name: "Pattern Flooring", image: "/media/product-herringbone.jpg", detail: { zh: "人字拼 · 鱼骨拼 · 定制", en: "Herringbone · Chevron · Custom", es: "Espiga · Chevron · A medida", de: "Fischgrät · Chevron · Individuell" } },
] as const;

export async function HomePage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const e = editorialCopy[locale];
  const products = await getPublishedProducts();
  const proofPoints = [
    [Layers3, t.waterproof],
    [Factory, t.oemShort],
    [CheckCircle2, t.compliance],
    [MessageCircle, t.response],
  ] as const;

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="relative isolate min-h-[42rem] overflow-hidden bg-[#07111f] text-white lg:min-h-[47rem]">
          <Image
            src="/media/hero-flooring.jpg"
            alt="Contemporary interior with Tooyei flooring"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,14,27,0.96)_0%,rgba(5,14,27,0.82)_43%,rgba(5,14,27,0.2)_78%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#07111f]/95 to-transparent" />

          <div className="relative mx-auto flex min-h-[42rem] max-w-[90rem] items-center px-5 py-20 lg:min-h-[47rem] lg:px-10">
            <div className="max-w-3xl pt-2">
              <p className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#e0c184]">
                <span className="h-px w-9 bg-[#c8a66a]" />
                {t.heroEyebrow}
              </p>
              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-[5.4rem]">
                {t.heroTitle}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/68 sm:text-lg">{t.heroBody}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full bg-[#bd9351] px-6 text-[#07111f] hover:bg-[#d0ab6d]">
                  <Link href={localizedPath(locale, "/products")}>{t.explore}<ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white backdrop-blur hover:bg-white hover:text-[#07111f]">
                  <Link href={localizedPath(locale, "/contact")}>{t.discuss}<ArrowUpRight /></Link>
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 right-10 hidden w-64 border-l border-white/20 pl-6 xl:block">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/35">TOOYEI / 2026</p>
              <p className="mt-3 text-sm leading-6 text-white/65">Flooring systems for wholesale, project and private-label markets.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[90rem] grid-cols-2 divide-x divide-slate-200 px-5 md:grid-cols-4 lg:px-10">
            {proofPoints.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-3 px-3 py-6 text-xs font-semibold text-slate-700 sm:px-6 sm:text-sm">
                <Icon className="size-5 shrink-0 text-[#b68a4c]" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="brand-eyebrow">01 · {e.collectionEyebrow}</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                {e.collectionTitle}
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-xl text-base leading-7 text-muted-foreground">{e.collectionBody}</p>
              <Button asChild variant="link" className="mt-5 h-auto p-0 font-semibold text-[#07111f]">
                <Link href={localizedPath(locale, "/products")}>{t.viewAll}<ArrowRight /></Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            {collectionCards.map((card, index) => (
              <Link
                key={card.name}
                href={localizedPath(locale, "/products")}
                className={`${index === 0 || index === 3 ? "lg:col-span-7" : "lg:col-span-5"} group relative min-h-[23rem] overflow-hidden bg-[#dfe3e6] lg:min-h-[30rem]`}
              >
                <Image src={card.image} alt={card.name} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/90 via-[#07111f]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 text-white sm:p-8">
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/50">0{index + 1} / Collection</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{card.name}</h3>
                    <p className="mt-2 text-xs tracking-[0.08em] text-white/55">{card.detail[locale]}</p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur transition group-hover:bg-white group-hover:text-[#07111f]">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-32">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="brand-eyebrow">02 · {locale === "zh" ? t.collectionsLabel : "CURATED PRODUCTS"}</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">{t.featured}</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">{t.featuredBody}</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
            </div>
          </div>
        </section>

        <section id="company" className="bg-[#07111f] text-white">
          <div className="mx-auto grid max-w-[90rem] gap-16 px-5 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-32">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#c8a66a]">03 · {e.applicationsEyebrow}</p>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl">{e.applicationsTitle}</h2>
              <p className="mt-6 max-w-xl leading-7 text-white/55">{e.applicationsBody}</p>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {e.applications.map((application, index) => (
                  <div key={application} className="flex items-center gap-3 border-t border-white/10 py-4 text-sm text-white/70">
                    <span className="font-mono text-[0.62rem] text-[#c8a66a]">0{index + 1}</span>
                    {application}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {[
                [Sparkles, e.designLabel, "Wood · Stone · Pattern"],
                [ShieldCheck, e.performanceLabel, "Waterproof · Wear · Stability"],
                [Factory, e.deliveryLabel, "OEM · QC · Export"],
                [Globe2, locale === "zh" ? t.exportMarkets : "Global markets", "Wholesale · Projects · Brands"],
              ].map(([Icon, label, detail]) => {
                const Component = Icon as typeof Sparkles;
                return (
                  <div key={String(label)} className="bg-[#07111f] p-7 sm:p-9">
                    <Component className="size-6 text-[#c8a66a]" />
                    <p className="mt-12 text-xl font-semibold tracking-[-0.025em]">{String(label)}</p>
                    <p className="mt-2 text-xs tracking-[0.05em] text-white/35">{String(detail)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="oem" className="mx-auto grid max-w-[90rem] gap-14 px-5 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-10 lg:py-32">
          <div className="lg:sticky lg:top-40">
            <p className="brand-eyebrow">04 · {e.processEyebrow}</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] text-slate-950 sm:text-5xl">{e.processTitle}</h2>
            <p className="mt-6 max-w-lg leading-7 text-muted-foreground">{e.processBody}</p>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-[#e4e6e7]">
              <Image src="/media/product-eir-spc.jpg" alt="Flooring texture selected for an OEM project" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
            </div>
          </div>

          <div className="border-t border-slate-300">
            {e.process.map(([title, body], index) => (
              <div key={title} className="grid gap-4 border-b border-slate-300 py-7 sm:grid-cols-[4rem_0.7fr_1.3fr] sm:items-start sm:py-9">
                <span className="font-mono text-xs tracking-[0.16em] text-[#b68a4c]">0{index + 1}</span>
                <h3 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
            <Button asChild size="lg" className="mt-9 h-12 rounded-full bg-[#07111f] px-6 text-white hover:bg-[#16243a]">
              <Link href={localizedPath(locale, "/contact")}>{e.start}<ArrowUpRight /></Link>
            </Button>
          </div>
        </section>

        <section id="resources" className="border-t border-[#d9d3c7] bg-[#e9e2d5] text-[#07111f]">
          <div className="mx-auto max-w-[90rem] px-5 py-20 lg:px-10 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#876532]">05 · {e.resourcesEyebrow}</p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl">{e.resourcesTitle}</h2>
              </div>
              <p className="max-w-xl leading-7 text-[#07111f]/60 lg:justify-self-end">{e.resourcesBody}</p>
            </div>
            <div className="mt-12 grid gap-px border border-[#07111f]/15 bg-[#07111f]/15 md:grid-cols-3">
              {e.resourceCards.map(([title, body], index) => {
                const icons = [Layers3, FileText, PackageCheck] as const;
                const Icon = icons[index] ?? Ruler;
                return (
                  <Link key={title} href={index === 0 ? localizedPath(locale, "/products") : localizedPath(locale, "/contact")} className="group bg-[#e9e2d5] p-7 transition hover:bg-[#f2ede4] sm:p-9">
                    <div className="flex items-start justify-between gap-6">
                      <Icon className="size-6 text-[#876532]" />
                      <ArrowUpRight className="size-4 text-[#07111f]/30 transition group-hover:text-[#07111f]" />
                    </div>
                    <h3 className="mt-12 text-xl font-semibold tracking-[-0.025em]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#07111f]/55">{body}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

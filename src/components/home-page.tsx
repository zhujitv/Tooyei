import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Globe2,
  Layers3,
  MessageCircle,
  PackageCheck,
  Palette,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { getPublishedProducts } from "@/lib/repositories/products";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";

type HomeCopy = {
  hero: { eyebrow: string; title: string; body: string; primary: string; secondary: string };
  capabilities: string[];
  trust: { title: string; body: string; metrics: Array<[string, string]> };
  systems: { eyebrow: string; title: string; body: string; action: string };
  featured: { eyebrow: string; title: string; body: string; action: string };
  applications: {
    eyebrow: string;
    title: string;
    body: string;
    cards: Array<[string, string]>;
    pillars: Array<[string, string]>;
  };
  oem: { eyebrow: string; title: string; body: string; steps: Array<[string, string]>; action: string };
  why: { eyebrow: string; title: string; body: string; values: Array<[string, string]> };
  support: { eyebrow: string; title: string; body: string; cards: Array<[string, string]>; action: string };
  global: { eyebrow: string; title: string; body: string; markets: string; follow: string };
  newsletter: { eyebrow: string; title: string; body: string };
  cta: { eyebrow: string; title: string; body: string; action: string };
};

const homeCopy: Record<Locale, HomeCopy> = {
  zh: {
    hero: {
      eyebrow: "专业地板系统 · 始于 2015",
      title: "为全球市场，\n打造可靠地板。",
      body: "面向进口商、经销商、工程项目与自有品牌客户，提供 SPC、WPC、LVT、强化地板及灵活的 OEM / ODM 解决方案。",
      primary: "浏览产品",
      secondary: "提交项目需求",
    },
    capabilities: ["防水地板系统", "灵活 OEM / ODM", "出口文件支持", "快速商务响应"],
    trust: {
      title: "为长期合作而建立",
      body: "从产品开发到出口交付，为全球地板采购客户提供清晰、稳定和可执行的合作体系。",
      metrics: [["2015", "品牌创立"], ["OEM / ODM", "灵活定制"], ["Global Export", "全球市场支持"], ["One Team", "产品与项目统一对接"]],
    },
    systems: {
      eyebrow: "产品系统",
      title: "每一种空间，都有合适的地板系统。",
      body: "从刚性芯层到舒适静音，从自然木纹到建筑感石纹，以清晰的产品系列帮助采购与设计团队快速决策。",
      action: "浏览全部产品",
    },
    featured: {
      eyebrow: "精选产品",
      title: "从成熟产品开始选择。",
      body: "围绕防水性能、自然纹理与工程适配精选产品，所有标签均来自现有产品资料。",
      action: "查看全部产品",
    },
    applications: {
      eyebrow: "应用场景",
      title: "面向真实项目，平衡设计与性能。",
      body: "以现有室内素材建立清晰的应用方向，帮助采购与设计团队理解不同地板系统的空间适配性。",
      cards: [
        ["住宅与公寓", "兼顾舒适、防水与日常维护，适应多样居住空间。"],
        ["酒店与餐饮", "关注视觉连贯、脚感与高频使用下的维护效率。"],
        ["零售与展厅", "以清晰纹理和稳定性能支持品牌化商业空间。"],
        ["办公与公共空间", "面向持续使用场景，平衡耐用、安装与空间表达。"],
      ],
      pillars: [["Design", "木纹、石纹与拼花"], ["Performance", "防水、耐磨与稳定"], ["Delivery", "OEM、品控与出口"], ["Markets", "批发、工程与品牌"]],
    },
    oem: {
      eyebrow: "OEM / ODM 项目协作",
      title: "从需求到交付，每一步都清楚。",
      body: "把市场定位、结构、花色、锁扣、底垫、包装和资料要求转化为可执行的产品方案。",
      steps: [["需求确认", "市场、应用、价格带与目标规格"], ["产品匹配", "结构、花色、表面、锁扣与底垫"], ["样品确认", "实物效果、规格、包装与技术资料"], ["批量交付", "质量检查、出口包装与装运协同"]],
      action: "提交项目需求",
    },
    why: {
      eyebrow: "品牌价值",
      title: "为什么选择 TOOYEI",
      body: "我们用清晰的产品体系与统一的项目协作，替代空泛的规模叙事。",
      values: [
        ["稳定产品体系", "围绕主流地板结构与市场应用建立清晰产品组合。"],
        ["灵活定制能力", "支持颜色、表面、结构、包装与自有品牌方案。"],
        ["清晰项目协作", "从需求、样品到量产交付，由统一团队协调。"],
        ["面向出口市场", "重视产品资料、包装、沟通效率与交付配合。"],
      ],
    },
    support: {
      eyebrow: "采购支持",
      title: "让产品资料和项目沟通更高效。",
      body: "产品参数、样品计划和 OEM 需求由同一团队协调，减少跨环节的信息损耗。",
      cards: [["产品目录", "按系统、花色和应用筛选现有产品。"], ["技术资料", "获取结构、规格与性能相关信息。"], ["样品计划", "围绕目标市场与项目方向安排样品。"], ["OEM 项目表", "快速提交产品、规格、包装和市场要求。"]],
      action: "联系获取",
    },
    global: {
      eyebrow: "GLOBAL BUSINESS",
      title: "面向全球市场",
      body: "为进口商、分销商、工程采购和自有品牌客户提供地板产品与 OEM 支持。",
      markets: "Europe · North America · Australia · Middle East · Asia",
      follow: "Follow TOOYEI",
    },
    newsletter: { eyebrow: "Stay Updated", title: "保持产品信息同步。", body: "获取新品系列、设计灵感与产品资料更新。" },
    cta: {
      eyebrow: "START A PROJECT",
      title: "让我们一起，\n建立更可靠的地板产品。",
      body: "面向批发、工程和自有品牌客户，提供产品选择、OEM 开发与出口协作支持。",
      action: "开始项目咨询",
    },
  },
  en: {
    hero: {
      eyebrow: "PROFESSIONAL FLOORING SYSTEMS · SINCE 2015",
      title: "Reliable flooring,\nbuilt for global markets.",
      body: "SPC, WPC, LVT and laminate flooring with flexible OEM / ODM support for importers, distributors, projects and private-label brands.",
      primary: "Explore products",
      secondary: "Send a project brief",
    },
    capabilities: ["Waterproof flooring systems", "Flexible OEM / ODM", "Export documentation", "Responsive business support"],
    trust: {
      title: "Built for long-term partnership",
      body: "A clear, dependable and actionable way of working—from product development through export delivery.",
      metrics: [["2015", "Brand established"], ["OEM / ODM", "Flexible customization"], ["Global Export", "International market support"], ["One Team", "Product and project coordination"]],
    },
    systems: { eyebrow: "Flooring systems", title: "A flooring system for every kind of space.", body: "From rigid performance to quiet comfort, natural timber character to architectural stone—clear collections for faster sourcing decisions.", action: "Explore all products" },
    featured: { eyebrow: "Featured products", title: "Start with proven products.", body: "Selected for waterproof performance, authentic texture and project versatility, using information from our current product data.", action: "View all products" },
    applications: {
      eyebrow: "Applications", title: "Designed for real-world spaces.", body: "Clear application directions help sourcing and design teams align each flooring system with project needs.",
      cards: [["Residential & apartments", "Comfort, water resistance and straightforward everyday care."], ["Hospitality & dining", "Visual continuity and practical maintenance for frequent use."], ["Retail & showrooms", "Distinctive textures with dependable commercial performance."], ["Workplace & public space", "Durability, installation efficiency and considered design."]],
      pillars: [["Design", "Wood, stone and pattern"], ["Performance", "Water, wear and stability"], ["Delivery", "OEM, QC and export"], ["Markets", "Wholesale, projects and brands"]],
    },
    oem: { eyebrow: "OEM / ODM collaboration", title: "A clear path from brief to delivery.", body: "We translate market positioning, construction, decor, locking, backing, packaging and documentation into an actionable programme.", steps: [["Confirm the brief", "Market, application, price point and target specification"], ["Match the product", "Construction, decor, surface, locking and backing"], ["Approve samples", "Physical finish, specification, packaging and data"], ["Produce & deliver", "Quality checks, export packing and shipment support"]], action: "Send a project brief" },
    why: { eyebrow: "Brand values", title: "Why TOOYEI", body: "Clear product systems and coordinated project work—without inflated scale claims.", values: [["Stable product systems", "Clear product families built around mainstream constructions and applications."], ["Flexible customization", "Colour, surface, construction, packaging and private-label options."], ["Clear collaboration", "One team coordinates the brief, sampling and production delivery."], ["Export market focus", "Careful documentation, packaging, communication and delivery support."]] },
    support: { eyebrow: "Sourcing support", title: "Better information. Faster project conversations.", body: "Specifications, samples and OEM requirements are coordinated by one team to reduce friction.", cards: [["Product catalogue", "Browse existing products by system, decor and application."], ["Technical information", "Request construction, specification and performance details."], ["Sample planning", "Plan samples around your market and project direction."], ["OEM project brief", "Share product, specification, packaging and market needs."]], action: "Request access" },
    global: { eyebrow: "GLOBAL BUSINESS", title: "Built for global markets", body: "Flooring products and OEM support for importers, distributors, project buyers and private-label brands.", markets: "Europe · North America · Australia · Middle East · Asia", follow: "Follow TOOYEI" },
    newsletter: { eyebrow: "Stay Updated", title: "Keep product information within reach.", body: "Receive updates on new collections, design directions and product materials." },
    cta: { eyebrow: "START A PROJECT", title: "Let’s build a more\nreliable flooring programme.", body: "Product selection, OEM development and export collaboration for wholesale, projects and private-label brands.", action: "Start a project" },
  },
  es: {
    hero: { eyebrow: "SISTEMAS DE SUELO · DESDE 2015", title: "Suelos fiables para\nmercados globales.", body: "SPC, WPC, LVT y laminado con soporte OEM / ODM para importadores, distribuidores, proyectos y marcas privadas.", primary: "Ver productos", secondary: "Enviar proyecto" },
    capabilities: ["Sistemas impermeables", "OEM / ODM flexible", "Documentación de exportación", "Respuesta comercial ágil"],
    trust: { title: "Creado para relaciones duraderas", body: "Una colaboración clara y fiable, desde el desarrollo hasta la entrega de exportación.", metrics: [["2015", "Fundación de la marca"], ["OEM / ODM", "Personalización flexible"], ["Global Export", "Soporte internacional"], ["One Team", "Coordinación unificada"]] },
    systems: { eyebrow: "Sistemas de suelo", title: "Un sistema para cada tipo de espacio.", body: "Colecciones claras, desde núcleos rígidos hasta confort acústico y acabados de madera o piedra.", action: "Ver productos" },
    featured: { eyebrow: "Productos destacados", title: "Empiece con productos consolidados.", body: "Seleccionados por rendimiento, textura y versatilidad con información de producto existente.", action: "Ver todos" },
    applications: { eyebrow: "Aplicaciones", title: "Diseñado para espacios reales.", body: "Direcciones claras para relacionar cada sistema con las necesidades del proyecto.", cards: [["Viviendas y apartamentos", "Confort, resistencia al agua y mantenimiento sencillo."], ["Hoteles y restauración", "Continuidad visual para espacios de uso frecuente."], ["Retail y showrooms", "Texturas claras y rendimiento comercial fiable."], ["Oficinas y espacios públicos", "Durabilidad, instalación y diseño equilibrados."]], pillars: [["Design", "Madera, piedra y patrón"], ["Performance", "Agua, desgaste y estabilidad"], ["Delivery", "OEM, calidad y exportación"], ["Markets", "Mayoristas, proyectos y marcas"]] },
    oem: { eyebrow: "Colaboración OEM / ODM", title: "Del briefing a la entrega, con claridad.", body: "Convertimos mercado, estructura, diseño, cierre, base, embalaje y documentación en un programa viable.", steps: [["Confirmar requisitos", "Mercado, uso, precio y especificación"], ["Definir producto", "Estructura, diseño, superficie, cierre y base"], ["Aprobar muestras", "Acabado, especificaciones, embalaje y datos"], ["Producir y entregar", "Calidad, embalaje de exportación y envío"]], action: "Enviar proyecto" },
    why: { eyebrow: "Valores de marca", title: "Por qué TOOYEI", body: "Sistemas claros y coordinación de proyecto sin afirmaciones exageradas.", values: [["Sistemas estables", "Familias claras para estructuras y aplicaciones habituales."], ["Personalización flexible", "Color, superficie, estructura, embalaje y marca privada."], ["Colaboración clara", "Un equipo coordina requisitos, muestras y producción."], ["Enfoque exportador", "Documentación, embalaje, comunicación y entrega."]] },
    support: { eyebrow: "Soporte de compras", title: "Mejor información. Proyectos más ágiles.", body: "Especificaciones, muestras y OEM coordinados por un único equipo.", cards: [["Catálogo", "Productos por sistema, diseño y aplicación."], ["Información técnica", "Estructura, especificaciones y rendimiento."], ["Plan de muestras", "Muestras según mercado y proyecto."], ["Formulario OEM", "Producto, especificación, embalaje y mercado."]], action: "Solicitar" },
    global: { eyebrow: "GLOBAL BUSINESS", title: "Para mercados globales", body: "Productos y soporte OEM para importadores, distribuidores, proyectos y marcas privadas.", markets: "Europe · North America · Australia · Middle East · Asia", follow: "Follow TOOYEI" },
    newsletter: { eyebrow: "Stay Updated", title: "Información de producto siempre disponible.", body: "Nuevas colecciones, inspiración y materiales de producto." },
    cta: { eyebrow: "START A PROJECT", title: "Construyamos un programa\nde suelos más fiable.", body: "Selección, desarrollo OEM y colaboración de exportación para mayoristas, proyectos y marcas privadas.", action: "Iniciar proyecto" },
  },
  de: {
    hero: { eyebrow: "PROFESSIONELLE BODENSYSTEME · SEIT 2015", title: "Zuverlässige Böden für\nglobale Märkte.", body: "SPC-, WPC-, LVT- und Laminatböden mit flexiblem OEM / ODM Support für Importeure, Händler, Projekte und Eigenmarken.", primary: "Produkte entdecken", secondary: "Projekt anfragen" },
    capabilities: ["Wasserfeste Systeme", "Flexibles OEM / ODM", "Exportdokumentation", "Schneller Business-Support"],
    trust: { title: "Für langfristige Partnerschaften", body: "Eine klare und verlässliche Zusammenarbeit von der Produktentwicklung bis zur Exportlieferung.", metrics: [["2015", "Markengründung"], ["OEM / ODM", "Flexible Anpassung"], ["Global Export", "Internationale Unterstützung"], ["One Team", "Zentrale Koordination"]] },
    systems: { eyebrow: "Bodensysteme", title: "Ein Bodensystem für jede Art von Raum.", body: "Klare Kollektionen von starrer Leistung bis zu leisem Komfort und Holz- oder Steinoptik.", action: "Alle Produkte" },
    featured: { eyebrow: "Ausgewählte Produkte", title: "Beginnen Sie mit bewährten Produkten.", body: "Ausgewählt nach Leistung, Oberfläche und Projekteignung auf Basis vorhandener Produktdaten.", action: "Alle ansehen" },
    applications: { eyebrow: "Anwendungen", title: "Für reale Räume entwickelt.", body: "Klare Einsatzbereiche verbinden jedes Bodensystem mit den Anforderungen des Projekts.", cards: [["Wohnen & Apartments", "Komfort, Wasserbeständigkeit und einfache Pflege."], ["Hotels & Gastronomie", "Visuelle Kontinuität bei häufiger Nutzung."], ["Retail & Showrooms", "Markante Oberflächen und zuverlässige Leistung."], ["Arbeits- & öffentliche Räume", "Haltbarkeit, Verlegung und Design im Gleichgewicht."]], pillars: [["Design", "Holz, Stein und Muster"], ["Performance", "Wasser, Verschleiß und Stabilität"], ["Delivery", "OEM, Qualität und Export"], ["Markets", "Großhandel, Projekte und Marken"]] },
    oem: { eyebrow: "OEM / ODM Zusammenarbeit", title: "Ein klarer Weg vom Briefing zur Lieferung.", body: "Wir übersetzen Markt, Aufbau, Dekor, Verriegelung, Unterlage, Verpackung und Dokumentation in ein umsetzbares Programm.", steps: [["Anforderungen klären", "Markt, Anwendung, Preis und Spezifikation"], ["Produkt abstimmen", "Aufbau, Dekor, Oberfläche, Klick und Unterlage"], ["Muster freigeben", "Oberfläche, Daten, Verpackung und Dokumente"], ["Produzieren & liefern", "Qualität, Exportverpackung und Versand"]], action: "Projekt anfragen" },
    why: { eyebrow: "Markenwerte", title: "Warum TOOYEI", body: "Klare Produktsysteme und koordinierte Projektarbeit ohne übertriebene Versprechen.", values: [["Stabile Produktsysteme", "Klare Familien für marktübliche Aufbauten und Anwendungen."], ["Flexible Anpassung", "Farbe, Oberfläche, Aufbau, Verpackung und Eigenmarke."], ["Klare Zusammenarbeit", "Ein Team koordiniert Briefing, Muster und Produktion."], ["Exportmarktfokus", "Dokumentation, Verpackung, Kommunikation und Lieferung."]] },
    support: { eyebrow: "Einkaufssupport", title: "Bessere Daten. Schnellere Projekte.", body: "Spezifikationen, Muster und OEM-Anforderungen werden von einem Team koordiniert.", cards: [["Produktkatalog", "Produkte nach System, Dekor und Anwendung."], ["Technische Daten", "Aufbau, Spezifikation und Leistung."], ["Musterplanung", "Muster für Markt und Projekt."], ["OEM-Projektbrief", "Produkt, Spezifikation, Verpackung und Markt."]], action: "Anfragen" },
    global: { eyebrow: "GLOBAL BUSINESS", title: "Für globale Märkte", body: "Produkte und OEM-Support für Importeure, Händler, Projekte und Eigenmarken.", markets: "Europe · North America · Australia · Middle East · Asia", follow: "Follow TOOYEI" },
    newsletter: { eyebrow: "Stay Updated", title: "Produktinformationen immer griffbereit.", body: "Updates zu Kollektionen, Designrichtungen und Produktunterlagen." },
    cta: { eyebrow: "START A PROJECT", title: "Entwickeln wir ein\nverlässliches Bodenprogramm.", body: "Produktauswahl, OEM-Entwicklung und Exportunterstützung für Großhandel, Projekte und Eigenmarken.", action: "Projekt starten" },
  },
};

const systems = [
  { name: "SPC Rigid Core", image: "/media/product-eir-spc.jpg", detail: { zh: "防水 · 稳定 · 锁扣", en: "Waterproof · Stable · Click", es: "Impermeable · Estable · Click", de: "Wasserfest · Stabil · Klick" } },
  { name: "WPC Comfort", image: "/media/product-wpc.jpg", detail: { zh: "静音 · 温润 · 舒适", en: "Quiet · Warm · Resilient", es: "Silencioso · Cálido · Cómodo", de: "Leise · Warm · Komfortabel" } },
  { name: "LVT Design", image: "/media/product-lvt.jpg", detail: { zh: "灵活 · 精致 · 工程适用", en: "Versatile · Refined · Project-ready", es: "Versátil · Refinado · Profesional", de: "Vielseitig · Fein · Projektbereit" } },
  { name: "Pattern Flooring", image: "/media/product-herringbone.jpg", detail: { zh: "人字拼 · 鱼骨拼 · 定制", en: "Herringbone · Chevron · Custom", es: "Espiga · Chevron · A medida", de: "Fischgrät · Chevron · Individuell" } },
] as const;

const applicationImages = [
  "/media/product-lvt.jpg",
  "/media/product-wpc.jpg",
  "/media/product-tile-spc.jpg",
  "/media/product-eir-spc.jpg",
] as const;

const capabilityIcons = [ShieldCheck, SlidersHorizontal, FileCheck2, MessageCircle] as const;
const whyIcons = [Layers3, Palette, Workflow, Globe2] as const;
const supportIcons = [FileText, Ruler, PackageCheck, Target] as const;

export async function HomePage({ locale }: { locale: Locale }) {
  const t = homeCopy[locale];
  const products = await getPublishedProducts();

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="brand-hero relative isolate min-h-[620px] overflow-hidden bg-[var(--navy)] text-white lg:min-h-[720px]">
          <Image
            src="/media/hero-flooring.jpg"
            alt={locale === "zh" ? "现代室内空间中的木纹地板" : "Contemporary interior with wood-look flooring"}
            fill
            priority
            sizes="100vw"
            className="brand-hero-image object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.98)_0%,rgba(8,17,31,0.94)_34%,rgba(8,17,31,0.55)_48%,rgba(8,17,31,0.08)_72%,rgba(8,17,31,0.04)_100%)]" />
          <div aria-hidden="true" className="absolute left-[-0.03em] top-[16%] max-w-[9em] text-[clamp(5rem,12vw,12rem)] font-semibold leading-[0.72] tracking-[-0.07em] text-white/[0.045]">
            FLOORING SYSTEMS
          </div>

          <div className="relative mx-auto flex min-h-[620px] max-w-[90rem] items-center px-5 py-20 lg:min-h-[720px] lg:px-10">
            <div className="brand-fade-up max-w-[43rem]">
              <p className="brand-eyebrow-light"><span />{t.hero.eyebrow}</p>
              <h1 className="mt-7 max-w-[13em] whitespace-pre-line text-[clamp(2.6rem,6vw,4.5rem)] font-medium leading-[1.04] tracking-[-0.055em] text-white">
                {t.hero.title}
              </h1>
              <p className="mt-7 max-w-[39rem] text-base leading-8 text-white/72 sm:text-[1.08rem]">{t.hero.body}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-sm bg-[var(--gold)] px-6 text-[var(--navy)] shadow-none hover:bg-[var(--gold-hover)]">
                  <Link href={localizedPath(locale, "/products")}>{t.hero.primary}<ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-sm border-white/30 bg-transparent px-6 text-white shadow-none hover:bg-white hover:text-[var(--navy)]">
                  <Link href={localizedPath(locale, "/contact")}>{t.hero.secondary}<ArrowUpRight className="size-4" /></Link>
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 right-10 hidden w-72 border-l border-white/20 pl-6 xl:block">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">TOOYEI / SINCE 2015</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">Flooring systems for wholesale,{"\n"}projects and private-label brands.</p>
            </div>
          </div>
        </section>

        <section aria-label={locale === "zh" ? "核心能力" : "Core capabilities"} className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto grid max-w-[90rem] grid-cols-2 px-5 lg:grid-cols-4 lg:px-10">
            {t.capabilities.map((label, index) => {
              const Icon = capabilityIcons[index] ?? CheckCircle2;
              return (
                <div key={label} className="group flex min-h-24 items-center gap-3 border-b border-r border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] transition-colors last:border-r-0 hover:text-[var(--gold)] lg:border-b-0 lg:px-6">
                  <Icon className="size-5 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--gold)]" strokeWidth={1.6} />
                  {label}
                </div>
              );
            })}
          </div>
        </section>

        <section id="about" className="scroll-mt-28 bg-[var(--ivory)]">
          <div className="mx-auto max-w-[90rem] px-5 py-20 lg:px-10 lg:py-28">
            <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">TOOYEI / 2015</p>
                <h2 className="brand-h2 mt-5">{t.trust.title}</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)] lg:justify-self-end">{t.trust.body}</p>
            </div>
            <div className="mt-14 grid border-y border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
              {t.trust.metrics.map(([value, label], index) => (
                <div key={value} className="border-b border-[var(--border)] py-8 sm:px-7 lg:border-b-0 lg:border-r lg:py-10 lg:last:border-r-0">
                  <p className="text-2xl font-medium tracking-[-0.035em] text-[var(--navy)] sm:text-3xl">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]"><span className="mr-2 font-mono text-[0.62rem] text-[var(--gold)]">0{index + 1}</span>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--paper)]">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">01 · {t.systems.eyebrow}</p>
                <h2 className="brand-h2 mt-5 max-w-3xl">{t.systems.title}</h2>
              </div>
              <div className="lg:justify-self-end">
                <p className="max-w-xl text-base leading-8 text-[var(--muted)]">{t.systems.body}</p>
                <Link href={localizedPath(locale, "/products")} className="brand-text-link mt-5">{t.systems.action}<ArrowRight /></Link>
              </div>
            </div>

            <div className="brand-horizontal-scroll mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {systems.map((system, index) => (
                <Link key={system.name} href={localizedPath(locale, "/products")} className="group min-w-[82%] snap-start border border-[var(--border)] bg-white sm:min-w-[46%] lg:min-w-0">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#e6e3dd]">
                    <Image src={system.image} alt={system.name} fill sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">0{index + 1} / System</p>
                      <ArrowRight className="size-4 text-[var(--muted)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
                    </div>
                    <h3 className="mt-4 text-2xl font-medium tracking-[-0.035em] text-[var(--navy)] transition-colors group-hover:text-[var(--gold)]">{system.name}</h3>
                    <p className="mt-2 text-xs tracking-[0.07em] text-[var(--muted)]">{system.detail[locale]}</p>
                  </div>
                </Link>
              ))}
              <span aria-hidden="true" className="w-1 shrink-0 lg:hidden" />
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-white">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-28">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
              <div>
                <p className="brand-eyebrow">02 · {t.featured.eyebrow}</p>
                <h2 className="brand-h2 mt-5">{t.featured.title}</h2>
              </div>
              <div>
                <p className="max-w-xl text-base leading-8 text-[var(--muted)]">{t.featured.body}</p>
                <Link href={localizedPath(locale, "/products")} className="brand-text-link mt-4">{t.featured.action}<ArrowRight /></Link>
              </div>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
            </div>
          </div>
        </section>

        <section id="applications" className="scroll-mt-28 bg-[var(--navy)] text-white">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <p className="brand-eyebrow-light"><span />03 · {t.applications.eyebrow}</p>
                <h2 className="brand-h2 mt-5 max-w-3xl text-white">{t.applications.title}</h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-white/60 lg:justify-self-end">{t.applications.body}</p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {t.applications.cards.map(([title, body], index) => (
                <article key={title} className="group relative aspect-[3/4] overflow-hidden border border-white/10 bg-[var(--navy-soft)]">
                  <Image src={applicationImages[index] ?? applicationImages[0]} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover saturate-[0.72] transition-transform duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-mono text-[0.62rem] tracking-[0.16em] text-[var(--gold)]">0{index + 1}</p>
                    <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/62">{body}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {t.applications.pillars.map(([title, detail]) => (
                <div key={title} className="border-b border-white/10 py-6 sm:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="oem" className="scroll-mt-28 bg-[var(--paper)]">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">04 · {t.oem.eyebrow}</p>
                <h2 className="brand-h2 mt-5 max-w-3xl">{t.oem.title}</h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-[var(--muted)] lg:justify-self-end">{t.oem.body}</p>
            </div>

            <div className="mt-16 grid gap-0 md:grid-cols-4">
              {t.oem.steps.map(([title, body], index) => (
                <article key={title} className="group relative border-l border-[var(--border)] py-2 pl-8 pb-10 md:border-l-0 md:border-t md:px-6 md:pb-0 md:pt-9">
                  <span className="absolute -left-[5px] top-2 size-[9px] rounded-full border-2 border-[var(--paper)] bg-[var(--muted)] transition-colors group-hover:bg-[var(--gold)] md:-top-[5px] md:left-6" />
                  <p className="font-mono text-[0.65rem] tracking-[0.16em] text-[var(--gold)]">0{index + 1}</p>
                  <h3 className="mt-4 text-xl font-medium tracking-[-0.025em] text-[var(--navy)]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-6 border-t border-[var(--border)] pt-8 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {["Private Label", "Custom Packaging", "Export Documentation"].map((label) => (
                  <span key={label} className="border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--navy)]">{label}</span>
                ))}
              </div>
              <Button asChild size="lg" className="h-12 rounded-sm bg-[var(--navy)] px-6 text-white shadow-none hover:bg-[var(--navy-soft)]">
                <Link href={localizedPath(locale, "/contact")}>{t.oem.action}<ArrowUpRight className="size-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-white">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-28">
            <div className="max-w-3xl">
              <p className="brand-eyebrow">05 · {t.why.eyebrow}</p>
              <h2 className="brand-h2 mt-5">{t.why.title}</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">{t.why.body}</p>
            </div>
            <div className="mt-14 grid border-y border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
              {t.why.values.map(([title, body], index) => {
                const Icon = whyIcons[index] ?? Sparkles;
                return (
                  <div key={title} className="border-b border-[var(--border)] py-9 md:px-7 lg:border-b-0 lg:border-r lg:last:border-r-0">
                    <Icon className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
                    <h3 className="mt-10 text-xl font-medium tracking-[-0.025em] text-[var(--navy)]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="support" className="scroll-mt-28 bg-[var(--ivory)]">
          <div className="mx-auto max-w-[90rem] px-5 py-24 lg:px-10 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <p className="brand-eyebrow">06 · {t.support.eyebrow}</p>
                <h2 className="brand-h2 mt-5 max-w-3xl">{t.support.title}</h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-[var(--muted)] lg:justify-self-end">{t.support.body}</p>
            </div>
            <div className="mt-12 grid border border-[var(--border)] bg-[var(--border)] gap-px md:grid-cols-2 lg:grid-cols-4">
              {t.support.cards.map(([title, body], index) => {
                const Icon = supportIcons[index] ?? FileText;
                const href = index === 0 ? localizedPath(locale, "/products") : localizedPath(locale, "/contact");
                return (
                  <Link key={title} href={href} className="group flex min-h-72 flex-col bg-[var(--ivory)] p-7 transition-colors hover:bg-white">
                    <div className="flex items-start justify-between">
                      <Icon className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
                      <ArrowUpRight className="size-4 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold)]" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-xl font-medium tracking-[-0.025em] text-[var(--navy)]">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--navy)]">{t.support.action}<ArrowRight className="size-3.5" /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--navy-soft)] text-white">
          <div className="mx-auto grid max-w-[90rem] gap-16 px-5 py-24 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-28">
            <div>
              <p className="brand-eyebrow-light"><span />{t.global.eyebrow}</p>
              <h2 className="brand-h2 mt-5 text-white">{t.global.title}</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">{t.global.body}</p>
              <div className="mt-10 border-y border-white/10 py-6">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">Markets</p>
                <p className="mt-3 text-sm leading-7 text-white/72 sm:text-base">{t.global.markets}</p>
              </div>
            </div>
            <div className="lg:border-l lg:border-white/10 lg:pl-12">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/45">{t.global.follow}</p>
              <SocialLinks showLabels showArrow className="mt-5 flex-col items-stretch gap-0" linkClassName="w-full border-b border-white/10 py-3 text-sm font-medium text-white/70 hover:text-white" />
            </div>
          </div>
        </section>

        <section id="newsletter" className="scroll-mt-28 bg-[var(--paper)]">
          <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:px-10 lg:py-24">
            <div>
              <p className="brand-eyebrow">{t.newsletter.eyebrow}</p>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[var(--navy)] sm:text-4xl">{t.newsletter.title}</h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">{t.newsletter.body}</p>
            </div>
            <div className="lg:justify-self-end lg:w-full lg:max-w-xl">
              <NewsletterForm locale={locale} />
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-[var(--navy)] text-white">
          <div aria-hidden="true" className="absolute -right-32 -top-56 size-[42rem] rounded-full border border-white/[0.045]" />
          <div aria-hidden="true" className="absolute -right-10 -top-32 size-[30rem] rounded-full border border-white/[0.045]" />
          <div className="relative mx-auto grid max-w-[90rem] gap-12 px-5 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-10 lg:py-28">
            <div>
              <p className="brand-eyebrow-light"><span />{t.cta.eyebrow}</p>
              <h2 className="mt-6 max-w-4xl whitespace-pre-line text-[clamp(2.6rem,5vw,4.2rem)] font-medium leading-[1.06] tracking-[-0.055em]">{t.cta.title}</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">{t.cta.body}</p>
            </div>
            <div className="lg:justify-self-end">
              <Button asChild size="lg" className="h-12 rounded-sm bg-[var(--gold)] px-6 text-[var(--navy)] shadow-none hover:bg-[var(--gold-hover)]">
                <Link href={localizedPath(locale, "/contact")}>{t.cta.action}<ArrowUpRight className="size-4" /></Link>
              </Button>
              <div className="mt-7 space-y-2 text-sm text-white/60">
                <a href={`mailto:${siteConfig.email}`} className="block min-h-11 py-3 transition-colors hover:text-white">{siteConfig.email}</a>
                <SocialLinks showLabels linkClassName="min-h-11 justify-start text-white/60 hover:text-white" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

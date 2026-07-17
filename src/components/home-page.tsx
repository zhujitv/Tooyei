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
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublishedProducts } from "@/lib/repositories/products";
import { localizedPath, siteConfig, toContentLocale, type ContentLocale, type Locale } from "@/lib/site";

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

const homeCopy: Record<ContentLocale, HomeCopy> = {
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
  fr: {
    hero: { eyebrow: "SYSTÈMES DE SOL PROFESSIONNELS · DEPUIS 2015", title: "Des sols fiables pour\nles marchés mondiaux.", body: "Sols SPC, WPC, LVT et stratifiés avec un accompagnement OEM / ODM flexible pour les importateurs, distributeurs, projets et marques privées.", primary: "Découvrir les produits", secondary: "Envoyer un projet" },
    capabilities: ["Systèmes de sol étanches", "OEM / ODM flexible", "Documentation export", "Réponse commerciale rapide"],
    trust: { title: "Pensé pour des partenariats durables", body: "Une collaboration claire et fiable, du développement produit à la livraison export.", metrics: [["2015", "Création de la marque"], ["OEM / ODM", "Personnalisation flexible"], ["Global Export", "Accompagnement international"], ["One Team", "Coordination produit et projet"]] },
    systems: { eyebrow: "Systèmes de sol", title: "Un système adapté à chaque espace.", body: "Du noyau rigide au confort acoustique, du bois naturel à la pierre architecturale : des collections claires pour décider plus vite.", action: "Voir tous les produits" },
    featured: { eyebrow: "Produits à la une", title: "Commencez par des produits éprouvés.", body: "Sélectionnés pour leur résistance à l’eau, leur texture authentique et leur polyvalence, à partir de nos données produits actuelles.", action: "Voir tous les produits" },
    applications: { eyebrow: "Applications", title: "Conçu pour des espaces réels.", body: "Des orientations claires aident les équipes d’achat et de design à associer chaque système aux besoins du projet.", cards: [["Résidentiel et appartements", "Confort, résistance à l’eau et entretien quotidien simple."], ["Hôtellerie et restauration", "Continuité visuelle et entretien pratique pour un usage fréquent."], ["Commerce et showrooms", "Textures distinctives et performance commerciale fiable."], ["Bureaux et espaces publics", "Durabilité, efficacité de pose et design équilibré."]], pillars: [["Design", "Bois, pierre et motifs"], ["Performance", "Eau, usure et stabilité"], ["Livraison", "OEM, qualité et export"], ["Marchés", "Négoce, projets et marques"]] },
    oem: { eyebrow: "Collaboration OEM / ODM", title: "Un parcours clair, du brief à la livraison.", body: "Nous transformons le positionnement marché, la structure, le décor, le verrouillage, la sous-couche, l’emballage et la documentation en programme réalisable.", steps: [["Confirmer le brief", "Marché, usage, prix et spécification cible"], ["Définir le produit", "Structure, décor, surface, verrouillage et sous-couche"], ["Valider les échantillons", "Finition, spécification, emballage et données"], ["Produire et livrer", "Contrôle qualité, emballage export et expédition"]], action: "Envoyer un projet" },
    why: { eyebrow: "Valeurs de marque", title: "Pourquoi TOOYEI", body: "Des systèmes produits clairs et une coordination de projet unifiée, sans promesses de taille exagérées.", values: [["Systèmes produits stables", "Des familles claires pour les structures et usages principaux."], ["Personnalisation flexible", "Couleur, surface, structure, emballage et marque privée."], ["Collaboration claire", "Une équipe coordonne le brief, les échantillons et la production."], ["Orientation export", "Documentation, emballage, communication et livraison soignés."]] },
    support: { eyebrow: "Aide à l’approvisionnement", title: "De meilleures informations. Des échanges plus rapides.", body: "Spécifications, échantillons et besoins OEM sont coordonnés par une seule équipe.", cards: [["Catalogue produits", "Parcourir les produits par système, décor et application."], ["Informations techniques", "Demander structure, spécifications et performances."], ["Planification des échantillons", "Préparer les échantillons selon le marché et le projet."], ["Brief OEM", "Partager produit, spécification, emballage et marché."]], action: "Demander l’accès" },
    global: { eyebrow: "ACTIVITÉ MONDIALE", title: "Conçu pour les marchés mondiaux", body: "Produits de sol et accompagnement OEM pour importateurs, distributeurs, acheteurs de projets et marques privées.", markets: "Europe · Amérique du Nord · Australie · Moyen-Orient · Asie", follow: "Suivre TOOYEI" },
    newsletter: { eyebrow: "RESTEZ INFORMÉ", title: "Gardez les informations produits à portée de main.", body: "Recevez les nouveautés collections, orientations design et documentations produits." },
    cta: { eyebrow: "DÉMARRER UN PROJET", title: "Construisons un programme\nde sol plus fiable.", body: "Sélection produit, développement OEM et collaboration export pour le négoce, les projets et les marques privées.", action: "Démarrer un projet" },
  },
  ru: {
    hero: { eyebrow: "ПРОФЕССИОНАЛЬНЫЕ НАПОЛЬНЫЕ СИСТЕМЫ · С 2015 ГОДА", title: "Надёжные покрытия\nдля мировых рынков.", body: "SPC, WPC, LVT и ламинат с гибкой поддержкой OEM / ODM для импортёров, дистрибьюторов, проектов и частных марок.", primary: "Смотреть продукцию", secondary: "Отправить запрос" },
    capabilities: ["Водостойкие системы", "Гибкий OEM / ODM", "Экспортные документы", "Быстрая деловая поддержка"],
    trust: { title: "Создано для долгосрочного партнёрства", body: "Понятная и надёжная система работы — от разработки продукта до экспортной поставки.", metrics: [["2015", "Основание бренда"], ["OEM / ODM", "Гибкая кастомизация"], ["Global Export", "Поддержка мировых рынков"], ["One Team", "Единая координация"]] },
    systems: { eyebrow: "Системы покрытий", title: "Подходящее решение для каждого пространства.", body: "От жёсткого основания до тихого комфорта, от натурального дерева до архитектурного камня — понятные коллекции для быстрых решений.", action: "Все продукты" },
    featured: { eyebrow: "Избранные продукты", title: "Начните с проверенных решений.", body: "Продукты выбраны за водостойкость, естественную фактуру и гибкость применения на основе актуальных данных.", action: "Смотреть все" },
    applications: { eyebrow: "Применение", title: "Разработано для реальных пространств.", body: "Чёткие направления помогают закупщикам и дизайнерам сопоставить систему с задачами проекта.", cards: [["Жильё и апартаменты", "Комфорт, водостойкость и простой повседневный уход."], ["Отели и рестораны", "Визуальная цельность и практичный уход при частом использовании."], ["Розница и шоурумы", "Выразительные фактуры и надёжные коммерческие характеристики."], ["Офисы и общественные зоны", "Баланс долговечности, монтажа и дизайна."]], pillars: [["Дизайн", "Дерево, камень и узоры"], ["Характеристики", "Вода, износ и стабильность"], ["Поставка", "OEM, контроль и экспорт"], ["Рынки", "Опт, проекты и бренды"]] },
    oem: { eyebrow: "Сотрудничество OEM / ODM", title: "Понятный путь от задачи до поставки.", body: "Мы превращаем позиционирование, конструкцию, декор, замок, подложку, упаковку и документы в выполнимую программу.", steps: [["Согласовать задачу", "Рынок, применение, цена и целевая спецификация"], ["Подобрать продукт", "Конструкция, декор, поверхность, замок и подложка"], ["Утвердить образцы", "Внешний вид, спецификация, упаковка и данные"], ["Произвести и доставить", "Контроль качества, экспортная упаковка и отгрузка"]], action: "Отправить запрос" },
    why: { eyebrow: "Ценности бренда", title: "Почему TOOYEI", body: "Понятные продуктовые системы и единая проектная работа без преувеличенных заявлений.", values: [["Стабильные системы", "Понятные семейства для основных конструкций и применений."], ["Гибкая кастомизация", "Цвет, поверхность, конструкция, упаковка и частная марка."], ["Чёткое сотрудничество", "Одна команда ведёт задачу, образцы и производство."], ["Фокус на экспорт", "Документы, упаковка, коммуникация и поддержка поставки."]] },
    support: { eyebrow: "Поддержка закупок", title: "Больше данных. Быстрее обсуждение проекта.", body: "Характеристики, образцы и OEM-требования координирует одна команда.", cards: [["Каталог продукции", "Поиск по системе, декору и применению."], ["Технические материалы", "Конструкция, характеристики и показатели."], ["План образцов", "Образцы под рынок и направление проекта."], ["Запрос OEM", "Продукт, спецификация, упаковка и рынок."]], action: "Запросить" },
    global: { eyebrow: "ГЛОБАЛЬНЫЙ БИЗНЕС", title: "Для мировых рынков", body: "Напольные покрытия и OEM-поддержка для импортёров, дистрибьюторов, проектных закупок и частных марок.", markets: "Европа · Северная Америка · Австралия · Ближний Восток · Азия", follow: "Следить за TOOYEI" },
    newsletter: { eyebrow: "БУДЬТЕ В КУРСЕ", title: "Держите информацию о продуктах под рукой.", body: "Получайте новости о коллекциях, дизайне и продуктовых материалах." },
    cta: { eyebrow: "НАЧАТЬ ПРОЕКТ", title: "Создадим более надёжную\nпрограмму напольных покрытий.", body: "Подбор продуктов, OEM-разработка и экспортное сотрудничество для опта, проектов и частных марок.", action: "Начать проект" },
  },
  ja: {
    hero: { eyebrow: "プロフェッショナル床材システム · 2015年創業", title: "世界市場のための、\n信頼できるフローリング。", body: "輸入業者、販売店、プロジェクト、プライベートブランド向けに、SPC・WPC・LVT・ラミネート床材と柔軟なOEM・ODM支援を提供します。", primary: "製品を見る", secondary: "プロジェクトを相談" },
    capabilities: ["防水フロアシステム", "柔軟なOEM・ODM", "輸出書類サポート", "迅速なビジネス対応"],
    trust: { title: "長期的なパートナーシップのために", body: "製品開発から輸出納品まで、明確で信頼できる実行可能な協業体制を提供します。", metrics: [["2015", "ブランド創立"], ["OEM / ODM", "柔軟なカスタマイズ"], ["Global Export", "国際市場サポート"], ["One Team", "製品と案件を一元対応"]] },
    systems: { eyebrow: "フローリングシステム", title: "あらゆる空間に、適した床材システムを。", body: "剛性性能から静かな快適性、自然な木目から建築的な石目まで、選定を速める明確なコレクションです。", action: "すべての製品" },
    featured: { eyebrow: "注目製品", title: "実績ある製品から選べます。", body: "防水性、自然な質感、プロジェクト対応力を基準に、現在の製品データから厳選しています。", action: "すべて見る" },
    applications: { eyebrow: "用途", title: "実際の空間を想定した設計。", body: "明確な用途提案により、調達・設計チームが案件要件に合う床材を選びやすくします。", cards: [["住宅・マンション", "快適性、防水性、日々の手入れやすさを両立。"], ["ホテル・飲食", "利用頻度の高い空間に視覚的な統一感と実用的な維持管理。"], ["店舗・ショールーム", "個性的な質感と安定した商業性能。"], ["オフィス・公共空間", "耐久性、施工効率、デザインのバランス。"]], pillars: [["デザイン", "木目、石目、パターン"], ["性能", "防水、耐摩耗、安定性"], ["納品", "OEM、品質管理、輸出"], ["市場", "卸売、案件、ブランド"]] },
    oem: { eyebrow: "OEM・ODM協業", title: "要件から納品まで、明確なプロセス。", body: "市場ポジション、構造、柄、ロック、下地、梱包、書類要件を実行可能な製品計画に変換します。", steps: [["要件確認", "市場、用途、価格帯、目標仕様"], ["製品選定", "構造、柄、表面、ロック、下地"], ["サンプル承認", "仕上がり、仕様、梱包、資料"], ["量産・納品", "品質確認、輸出梱包、出荷支援"]], action: "プロジェクトを相談" },
    why: { eyebrow: "ブランド価値", title: "TOOYEIが選ばれる理由", body: "誇張された規模ではなく、明確な製品体系と統一された案件対応を重視します。", values: [["安定した製品体系", "主要な構造と用途を軸にした明確な製品群。"], ["柔軟なカスタマイズ", "色、表面、構造、梱包、プライベートブランドに対応。"], ["明確な協業", "要件、サンプル、量産を一つのチームが調整。"], ["輸出市場重視", "資料、梱包、連絡、納品支援を重視。"]] },
    support: { eyebrow: "調達サポート", title: "より良い情報で、案件協議を迅速に。", body: "仕様、サンプル、OEM要件を同じチームが調整し、情報ロスを減らします。", cards: [["製品カタログ", "システム、柄、用途から製品を検索。"], ["技術資料", "構造、仕様、性能情報を提供。"], ["サンプル計画", "市場と案件方向に合わせてサンプルを計画。"], ["OEM案件概要", "製品、仕様、梱包、市場要件を共有。"]], action: "資料を依頼" },
    global: { eyebrow: "グローバルビジネス", title: "世界市場に向けて", body: "輸入業者、販売店、プロジェクト調達、プライベートブランド向けの床材とOEM支援。", markets: "欧州 · 北米 · オーストラリア · 中東 · アジア", follow: "TOOYEIをフォロー" },
    newsletter: { eyebrow: "最新情報", title: "製品情報をいつでも身近に。", body: "新しいコレクション、デザイン、製品資料の更新をお届けします。" },
    cta: { eyebrow: "プロジェクトを開始", title: "より信頼できる床材計画を、\n一緒につくりましょう。", body: "卸売、プロジェクト、プライベートブランド向けの製品選定、OEM開発、輸出協業。", action: "相談を始める" },
  },
  it: {
    hero: { eyebrow: "SISTEMI DI PAVIMENTAZIONE PROFESSIONALI · DAL 2015", title: "Pavimenti affidabili per\ni mercati globali.", body: "Pavimenti SPC, WPC, LVT e laminati con supporto OEM / ODM flessibile per importatori, distributori, progetti e marchi privati.", primary: "Esplora i prodotti", secondary: "Invia un progetto" },
    capabilities: ["Sistemi impermeabili", "OEM / ODM flessibile", "Documentazione export", "Supporto commerciale rapido"],
    trust: { title: "Pensato per collaborazioni durature", body: "Un metodo di lavoro chiaro e affidabile, dallo sviluppo prodotto alla consegna export.", metrics: [["2015", "Fondazione del marchio"], ["OEM / ODM", "Personalizzazione flessibile"], ["Global Export", "Supporto internazionale"], ["One Team", "Coordinamento unico"]] },
    systems: { eyebrow: "Sistemi di pavimentazione", title: "Un sistema per ogni tipo di spazio.", body: "Dalle prestazioni rigide al comfort acustico, dal legno naturale alla pietra architettonica: collezioni chiare per decidere più rapidamente.", action: "Esplora tutti i prodotti" },
    featured: { eyebrow: "Prodotti in evidenza", title: "Parti da prodotti collaudati.", body: "Selezionati per impermeabilità, texture autentiche e versatilità, utilizzando i dati prodotto attuali.", action: "Vedi tutti" },
    applications: { eyebrow: "Applicazioni", title: "Progettato per spazi reali.", body: "Indicazioni chiare aiutano i team di acquisto e design ad abbinare ogni sistema alle esigenze del progetto.", cards: [["Residenziale e appartamenti", "Comfort, resistenza all’acqua e manutenzione quotidiana semplice."], ["Hotel e ristorazione", "Continuità visiva e manutenzione pratica per uso frequente."], ["Retail e showroom", "Texture distintive e prestazioni commerciali affidabili."], ["Uffici e spazi pubblici", "Durata, efficienza di posa e design equilibrato."]], pillars: [["Design", "Legno, pietra e motivi"], ["Prestazioni", "Acqua, usura e stabilità"], ["Consegna", "OEM, qualità ed export"], ["Mercati", "Ingrosso, progetti e marchi"]] },
    oem: { eyebrow: "Collaborazione OEM / ODM", title: "Un percorso chiaro dal brief alla consegna.", body: "Traduciamo posizionamento, struttura, decoro, incastro, supporto, imballaggio e documentazione in un programma realizzabile.", steps: [["Conferma del brief", "Mercato, applicazione, prezzo e specifica target"], ["Definizione prodotto", "Struttura, decoro, superficie, incastro e supporto"], ["Approvazione campioni", "Finitura, specifica, imballaggio e dati"], ["Produzione e consegna", "Controlli qualità, imballaggio export e spedizione"]], action: "Invia un progetto" },
    why: { eyebrow: "Valori del marchio", title: "Perché TOOYEI", body: "Sistemi di prodotto chiari e lavoro coordinato, senza affermazioni di scala esagerate.", values: [["Sistemi stabili", "Famiglie chiare per strutture e applicazioni principali."], ["Personalizzazione flessibile", "Colore, superficie, struttura, imballaggio e marchio privato."], ["Collaborazione chiara", "Un team coordina brief, campioni e produzione."], ["Focus export", "Documentazione, imballaggio, comunicazione e consegna."]] },
    support: { eyebrow: "Supporto acquisti", title: "Informazioni migliori. Progetti più rapidi.", body: "Specifiche, campioni e requisiti OEM sono coordinati da un unico team.", cards: [["Catalogo prodotti", "Sfoglia per sistema, decoro e applicazione."], ["Informazioni tecniche", "Richiedi struttura, specifiche e prestazioni."], ["Piano campioni", "Pianifica i campioni per mercato e progetto."], ["Brief OEM", "Condividi prodotto, specifica, imballaggio e mercato."]], action: "Richiedi accesso" },
    global: { eyebrow: "BUSINESS GLOBALE", title: "Pensato per i mercati globali", body: "Pavimenti e supporto OEM per importatori, distributori, acquirenti di progetto e marchi privati.", markets: "Europa · Nord America · Australia · Medio Oriente · Asia", follow: "Segui TOOYEI" },
    newsletter: { eyebrow: "RESTA AGGIORNATO", title: "Informazioni prodotto sempre disponibili.", body: "Ricevi aggiornamenti su collezioni, design e materiali di prodotto." },
    cta: { eyebrow: "AVVIA UN PROGETTO", title: "Costruiamo un programma\ndi pavimenti più affidabile.", body: "Selezione prodotto, sviluppo OEM e collaborazione export per ingrosso, progetti e marchi privati.", action: "Avvia un progetto" },
  },
  ar: {
    hero: { eyebrow: "أنظمة أرضيات احترافية · منذ 2015", title: "أرضيات موثوقة\nللأسواق العالمية.", body: "أرضيات SPC وWPC وLVT واللامينيت مع دعم OEM وODM مرن للمستوردين والموزعين والمشاريع والعلامات الخاصة.", primary: "استكشف المنتجات", secondary: "أرسل موجز المشروع" },
    capabilities: ["أنظمة مقاومة للماء", "OEM وODM مرن", "وثائق التصدير", "دعم تجاري سريع"],
    trust: { title: "مصمم لشراكات طويلة الأمد", body: "أسلوب عمل واضح وموثوق وقابل للتنفيذ، من تطوير المنتج حتى التسليم للتصدير.", metrics: [["2015", "تأسيس العلامة"], ["OEM / ODM", "تخصيص مرن"], ["Global Export", "دعم الأسواق العالمية"], ["One Team", "تنسيق المنتج والمشروع"]] },
    systems: { eyebrow: "أنظمة الأرضيات", title: "نظام أرضيات مناسب لكل مساحة.", body: "من الأداء الصلب إلى الراحة الهادئة، ومن الخشب الطبيعي إلى الحجر المعماري، تشكيلات واضحة لاتخاذ القرار بسرعة.", action: "استكشف كل المنتجات" },
    featured: { eyebrow: "منتجات مختارة", title: "ابدأ بمنتجات مجربة.", body: "مختارة لمقاومة الماء والملمس الطبيعي والمرونة في المشاريع اعتماداً على بيانات منتجاتنا الحالية.", action: "عرض كل المنتجات" },
    applications: { eyebrow: "التطبيقات", title: "مصمم للمساحات الواقعية.", body: "تساعد التوجيهات الواضحة فرق التوريد والتصميم على مطابقة كل نظام مع احتياجات المشروع.", cards: [["المنازل والشقق", "راحة ومقاومة للماء وسهولة في العناية اليومية."], ["الفنادق والمطاعم", "اتساق بصري وصيانة عملية للاستخدام المتكرر."], ["التجزئة وصالات العرض", "ملمس مميز وأداء تجاري موثوق."], ["المكاتب والمساحات العامة", "توازن بين المتانة وسهولة التركيب والتصميم."]], pillars: [["التصميم", "خشب وحجر ونقوش"], ["الأداء", "ماء وتآكل وثبات"], ["التسليم", "OEM وجودة وتصدير"], ["الأسواق", "جملة ومشاريع وعلامات"]] },
    oem: { eyebrow: "تعاون OEM وODM", title: "مسار واضح من المتطلبات إلى التسليم.", body: "نحوّل تموضع السوق والبنية والتصميم والقفل والطبقة السفلية والتغليف والوثائق إلى برنامج قابل للتنفيذ.", steps: [["تأكيد المتطلبات", "السوق والتطبيق والسعر والمواصفة المستهدفة"], ["مطابقة المنتج", "البنية والتصميم والسطح والقفل والطبقة السفلية"], ["اعتماد العينات", "التشطيب والمواصفات والتغليف والبيانات"], ["الإنتاج والتسليم", "فحص الجودة وتغليف التصدير ودعم الشحن"]], action: "أرسل موجز المشروع" },
    why: { eyebrow: "قيم العلامة", title: "لماذا TOOYEI", body: "أنظمة منتجات واضحة وعمل مشروع منسق دون ادعاءات مبالغ فيها.", values: [["أنظمة منتجات مستقرة", "عائلات واضحة للبنى والتطبيقات الرئيسية."], ["تخصيص مرن", "اللون والسطح والبنية والتغليف والعلامة الخاصة."], ["تعاون واضح", "فريق واحد ينسق المتطلبات والعينات والإنتاج."], ["تركيز على التصدير", "اهتمام بالوثائق والتغليف والتواصل والتسليم."]] },
    support: { eyebrow: "دعم التوريد", title: "معلومات أفضل. محادثات أسرع.", body: "ينسق فريق واحد المواصفات والعينات ومتطلبات OEM لتقليل فقدان المعلومات.", cards: [["كتالوج المنتجات", "تصفح حسب النظام والتصميم والتطبيق."], ["المعلومات الفنية", "اطلب البنية والمواصفات وبيانات الأداء."], ["تخطيط العينات", "خطط العينات وفق السوق واتجاه المشروع."], ["موجز OEM", "شارك المنتج والمواصفات والتغليف والسوق."]], action: "اطلب الوصول" },
    global: { eyebrow: "أعمال عالمية", title: "مصمم للأسواق العالمية", body: "أرضيات ودعم OEM للمستوردين والموزعين ومشتري المشاريع والعلامات الخاصة.", markets: "أوروبا · أمريكا الشمالية · أستراليا · الشرق الأوسط · آسيا", follow: "تابع TOOYEI" },
    newsletter: { eyebrow: "ابقَ على اطلاع", title: "احتفظ بمعلومات المنتجات في متناولك.", body: "احصل على تحديثات التشكيلات واتجاهات التصميم ومواد المنتجات." },
    cta: { eyebrow: "ابدأ مشروعاً", title: "لنبنِ برنامج أرضيات\nأكثر موثوقية.", body: "اختيار المنتجات وتطوير OEM والتعاون في التصدير للجملة والمشاريع والعلامات الخاصة.", action: "ابدأ مشروعاً" },
  },
};

const systems = [
  { name: "SPC Rigid Core", image: "/media/product-eir-spc.jpg", detail: { en: "Waterproof · Stable · Click", de: "Wasserfest · Stabil · Klick", fr: "Étanche · Stable · Clic", es: "Impermeable · Estable · Click", ru: "Водостойкость · Стабильность · Замок", ja: "防水 · 安定 · クリック", it: "Impermeabile · Stabile · Clic", ar: "مقاوم للماء · ثابت · قفل", zh: "防水 · 稳定 · 锁扣" } },
  { name: "WPC Comfort", image: "/media/product-wpc.jpg", detail: { en: "Quiet · Warm · Resilient", de: "Leise · Warm · Komfortabel", fr: "Silencieux · Chaleureux · Confortable", es: "Silencioso · Cálido · Cómodo", ru: "Тихо · Тепло · Комфортно", ja: "静音 · 温かさ · 快適", it: "Silenzioso · Caldo · Confortevole", ar: "هادئ · دافئ · مريح", zh: "静音 · 温润 · 舒适" } },
  { name: "LVT Design", image: "/media/product-lvt.jpg", detail: { en: "Versatile · Refined · Project-ready", de: "Vielseitig · Fein · Projektbereit", fr: "Polyvalent · Raffiné · Prêt pour les projets", es: "Versátil · Refinado · Profesional", ru: "Гибкость · Детали · Для проектов", ja: "柔軟 · 上質 · 案件対応", it: "Versatile · Raffinato · Pronto per progetti", ar: "مرن · راقٍ · جاهز للمشاريع", zh: "灵活 · 精致 · 工程适用" } },
  { name: "Pattern Flooring", image: "/media/product-herringbone.jpg", detail: { en: "Herringbone · Chevron · Custom", de: "Fischgrät · Chevron · Individuell", fr: "Bâton rompu · Chevron · Sur mesure", es: "Espiga · Chevron · A medida", ru: "Ёлочка · Шеврон · На заказ", ja: "ヘリンボーン · シェブロン · 特注", it: "Spina di pesce · Chevron · Su misura", ar: "متعرج · شيفرون · مخصص", zh: "人字拼 · 鱼骨拼 · 定制" } },
] as const;

const homeAuxCopy: Record<ContentLocale, { heroAlt: string; capabilitiesLabel: string; sideNote: string }> = {
  en: { heroAlt: "Contemporary interior with wood-look flooring", capabilitiesLabel: "Core capabilities", sideNote: "Flooring systems for wholesale, projects and private-label brands." },
  de: { heroAlt: "Moderner Innenraum mit Boden in Holzoptik", capabilitiesLabel: "Kernkompetenzen", sideNote: "Bodensysteme für Großhandel, Projekte und Eigenmarken." },
  fr: { heroAlt: "Intérieur contemporain avec sol aspect bois", capabilitiesLabel: "Compétences clés", sideNote: "Systèmes de sol pour le négoce, les projets et les marques privées." },
  es: { heroAlt: "Interior contemporáneo con suelo de aspecto madera", capabilitiesLabel: "Capacidades principales", sideNote: "Sistemas de suelo para mayoristas, proyectos y marcas privadas." },
  ru: { heroAlt: "Современный интерьер с напольным покрытием под дерево", capabilitiesLabel: "Ключевые возможности", sideNote: "Напольные системы для опта, проектов и частных марок." },
  ja: { heroAlt: "木目調フローリングの現代的なインテリア", capabilitiesLabel: "主な対応力", sideNote: "卸売、プロジェクト、プライベートブランド向け床材システム。" },
  it: { heroAlt: "Interno contemporaneo con pavimento effetto legno", capabilitiesLabel: "Competenze principali", sideNote: "Sistemi di pavimentazione per ingrosso, progetti e marchi privati." },
  ar: { heroAlt: "مساحة داخلية عصرية بأرضية بمظهر الخشب", capabilitiesLabel: "القدرات الأساسية", sideNote: "أنظمة أرضيات للجملة والمشاريع والعلامات الخاصة." },
  zh: { heroAlt: "现代室内空间中的木纹地板", capabilitiesLabel: "核心能力", sideNote: "面向批发、工程项目和自有品牌的地板系统。" },
};

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
  const contentLocale = toContentLocale(locale);
  const t = homeCopy[contentLocale];
  const auxiliary = homeAuxCopy[contentLocale];
  const [products, categories] = await Promise.all([getPublishedProducts(), getPublicCategoryTree(locale)]);

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} />
      <main>
        <section className="brand-hero relative isolate min-h-[620px] overflow-hidden bg-[var(--navy)] text-white lg:min-h-[720px]">
          <Image
            src="/media/hero-flooring.jpg"
            alt={auxiliary.heroAlt}
            fill
            priority
            sizes="100vw"
            className="brand-hero-image object-cover object-[62%_center]"
          />
          <div
            className={
              locale === "ar"
                ? "absolute inset-0 bg-[linear-gradient(270deg,rgba(8,17,31,0.98)_0%,rgba(8,17,31,0.94)_34%,rgba(8,17,31,0.55)_48%,rgba(8,17,31,0.08)_72%,rgba(8,17,31,0.04)_100%)]"
                : "absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.98)_0%,rgba(8,17,31,0.94)_34%,rgba(8,17,31,0.55)_48%,rgba(8,17,31,0.08)_72%,rgba(8,17,31,0.04)_100%)]"
            }
          />
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
              <p className="mt-3 text-sm leading-6 text-white/65">{auxiliary.sideNote}</p>
            </div>
          </div>
        </section>

        <section aria-label={auxiliary.capabilitiesLabel} className="border-b border-[var(--border)] bg-white">
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
                    <p className="mt-2 text-xs tracking-[0.07em] text-[var(--muted)]">{system.detail[contentLocale]}</p>
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

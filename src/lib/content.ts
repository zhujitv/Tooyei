import type { Locale } from "@/lib/site";

export type LocalizedText = Record<Locale, string>;

export type ProductFeatureItem = LocalizedText & {
  description?: LocalizedText;
  icon?: string;
};

export type ProductMediaItem = {
  url: string;
  alt: string;
  role: "PRIMARY" | "GALLERY" | "DETAIL" | "APPLICATION" | "PACKAGING" | "VIDEO";
  caption?: string;
};

export type ProductApplicationItem = {
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  imageAlt?: string;
};

export type ProductDownloadItem = {
  title: LocalizedText;
  description?: LocalizedText;
  url: string;
  kind: "CATALOG" | "SPEC_SHEET" | "INSTALLATION_GUIDE" | "WARRANTY" | "CERTIFICATE" | "OTHER";
};

export type Product = {
  slug: string;
  sku: string;
  category: string;
  title: LocalizedText;
  summary: LocalizedText;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  image: string;
  media?: ProductMediaItem[];
  features: ProductFeatureItem[];
  specifications: { group?: string; label: LocalizedText; value: string; unit?: string }[];
  applications?: ProductApplicationItem[];
  downloads?: ProductDownloadItem[];
};

export const products: Product[] = [
  {
    slug: "ty602-tile-spc-flooring",
    sku: "TY602",
    category: "SPC",
    title: {
      zh: "复古板岩纹 SPC 石塑地板",
      en: "Rustic Slate Tile SPC Flooring",
      es: "Suelo SPC efecto pizarra rústica",
      de: "Rustikaler Schiefer-SPC-Fliesenboden",
    },
    summary: {
      zh: "天然板岩质感与防水刚性芯层结合，适合住宅与商业空间稳定铺装。",
      en: "A natural slate look on a waterproof rigid core, designed for stable installation in residential and commercial interiors.",
      es: "Aspecto de pizarra natural sobre un núcleo rígido e impermeable para interiores residenciales y comerciales.",
      de: "Natürliche Schieferoptik auf einem wasserfesten Rigid-Core für Wohn- und Gewerberäume.",
    },
    image: "/media/product-tile-spc.jpg",
    features: [
      { zh: "100% 防水", en: "100% waterproof", es: "100 % impermeable", de: "100 % wasserfest" },
      { zh: "耐刮擦", en: "Scratch resistant", es: "Resistente a rayones", de: "Kratzfest" },
      { zh: "锁扣式安装", en: "Click-lock installation", es: "Instalación click", de: "Klick-Verlegung" },
    ],
    specifications: [
      { label: { zh: "表面", en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "Stone texture" },
      { label: { zh: "芯层", en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { zh: "应用", en: "Application", es: "Aplicación", de: "Anwendung" }, value: "Residential / Commercial" },
    ],
  },
  {
    slug: "waterproof-eir-spc-click-flooring",
    sku: "EIR-SPC",
    category: "SPC",
    title: { zh: "EIR 同步对花 SPC 锁扣地板", en: "EIR SPC Click Flooring", es: "Suelo SPC click EIR", de: "EIR SPC Klickboden" },
    summary: {
      zh: "同步压纹让木纹与触感精准对应，兼具逼真木质外观与刚性芯层性能。",
      en: "Registered embossing aligns grain and texture for a convincing timber finish with rigid-core performance.",
      es: "El relieve sincronizado alinea veta y textura para lograr un acabado de madera convincente.",
      de: "Synchronprägung verbindet Maserung und Struktur zu einer authentischen Holzoberfläche.",
    },
    image: "/media/product-eir-spc.jpg",
    features: [
      { zh: "同步对花压纹", en: "Embossed in register", es: "Relieve sincronizado", de: "Synchronprägung" },
      { zh: "易于维护", en: "Low maintenance", es: "Fácil mantenimiento", de: "Pflegeleicht" },
      { zh: "稳定刚性芯层", en: "Stable rigid core", es: "Núcleo rígido estable", de: "Stabiler Rigid-Core" },
    ],
    specifications: [
      { label: { zh: "表面", en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "EIR wood grain" },
      { label: { zh: "芯层", en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { zh: "安装", en: "Installation", es: "Instalación", de: "Verlegung" }, value: "Click lock" },
    ],
  },
  {
    slug: "vinyl-herringbone-stone-plastic-flooring",
    sku: "HB-SPC",
    category: "SPC",
    title: { zh: "人字拼 SPC 石塑地板", en: "Herringbone SPC Flooring", es: "Suelo SPC en espiga", de: "Fischgrät-SPC-Boden" },
    summary: {
      zh: "经典人字拼设计，具备防水性能，可应对高强度日常使用。",
      en: "A classic herringbone composition engineered for waterproof performance and demanding daily use.",
      es: "Composición clásica en espiga diseñada para resistir el agua y el uso diario intensivo.",
      de: "Klassisches Fischgrätbild mit wasserfester Konstruktion für intensive tägliche Nutzung.",
    },
    image: "/media/product-herringbone.jpg",
    features: [
      { zh: "人字拼纹理", en: "Herringbone pattern", es: "Patrón en espiga", de: "Fischgrätmuster" },
      { zh: "适合高人流空间", en: "High traffic ready", es: "Para alto tránsito", de: "Für hohe Beanspruchung" },
      { zh: "防水", en: "Waterproof", es: "Impermeable", de: "Wasserfest" },
    ],
    specifications: [
      { label: { zh: "拼法", en: "Pattern", es: "Patrón", de: "Muster" }, value: "Herringbone" },
      { label: { zh: "芯层", en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { zh: "用途", en: "Use", es: "Uso", de: "Nutzung" }, value: "Heavy residential / Commercial" },
    ],
  },
  {
    slug: "waterproof-oak-wpc-flooring",
    sku: "OAK-WPC",
    category: "WPC",
    title: { zh: "防水橡木纹 WPC 地板", en: "Waterproof Oak WPC Flooring", es: "Suelo WPC roble impermeable", de: "Wasserfester Eiche-WPC-Boden" },
    summary: {
      zh: "温润橡木外观搭配富有弹性的 WPC 芯层，营造舒适安静的室内空间。",
      en: "Warm oak visuals paired with a resilient WPC core for comfortable, quiet interiors.",
      es: "Diseño de roble cálido con núcleo WPC resistente para interiores cómodos y silenciosos.",
      de: "Warme Eichenoptik mit elastischem WPC-Kern für komfortable, ruhige Innenräume.",
    },
    image: "/media/product-wpc.jpg",
    features: [
      { zh: "舒适脚感", en: "Comfort underfoot", es: "Confort al pisar", de: "Angenehmes Laufgefühl" },
      { zh: "降噪", en: "Sound reducing", es: "Reducción acústica", de: "Schalldämmend" },
      { zh: "耐水", en: "Water resistant", es: "Resistente al agua", de: "Wasserbeständig" },
    ],
    specifications: [
      { label: { zh: "表面", en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "Oak wood grain" },
      { label: { zh: "芯层", en: "Core", es: "Núcleo", de: "Kern" }, value: "WPC core" },
      { label: { zh: "安装", en: "Installation", es: "Instalación", de: "Verlegung" }, value: "Floating click" },
    ],
  },
  {
    slug: "wood-look-lvt-flooring",
    sku: "WOOD-LVT",
    category: "LVT",
    title: { zh: "木纹 LVT 豪华乙烯基地板", en: "Wood Look LVT Flooring", es: "Suelo LVT efecto madera", de: "LVT-Boden in Holzoptik" },
    summary: {
      zh: "细腻木纹与灵活的 LVT 形态，适用于住宅、酒店和零售项目。",
      en: "Detailed wood visuals in a versatile LVT format for retail, hospitality and residential specifications.",
      es: "Acabado de madera detallado en formato LVT para proyectos residenciales, hoteleros y comerciales.",
      de: "Detailreiche Holzoptik im vielseitigen LVT-Format für Wohnen, Handel und Hotellerie.",
    },
    image: "/media/product-lvt.jpg",
    features: [
      { zh: "自然木纹外观", en: "Natural wood look", es: "Aspecto de madera natural", de: "Natürliche Holzoptik" },
      { zh: "易于打理", en: "Easy care", es: "Fácil de cuidar", de: "Pflegeleicht" },
      { zh: "适合工程项目", en: "Project ready", es: "Ideal para proyectos", de: "Projektgeeignet" },
    ],
    specifications: [
      { label: { zh: "饰面", en: "Finish", es: "Acabado", de: "Finish" }, value: "Wood look" },
      { label: { zh: "材质", en: "Material", es: "Material", de: "Material" }, value: "Luxury vinyl tile" },
      { label: { zh: "应用", en: "Application", es: "Aplicación", de: "Anwendung" }, value: "Residential / Hospitality / Retail" },
    ],
  },
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const copy: Record<Locale, Record<string, string>> = {
  zh: {
    products: "产品中心", company: "公司介绍", oem: "OEM / ODM", resources: "资源", contact: "联系我们",
    heroEyebrow: "专业地板制造商 · 始于 2015", heroTitle: "为更好的空间，打造可靠地板。",
    heroBody: "工厂直供 SPC、WPC、LVT 与强化地板，品质稳定，支持灵活定制，提供成熟的出口服务。",
    explore: "浏览产品", discuss: "咨询项目", featured: "精选产品系列",
    featuredBody: "围绕防水性能、自然纹理与工程适配精选产品，帮助采购团队更快找到适合目标市场的系列。",
    viewAll: "查看全部产品", viewProduct: "查看产品", proof: "让采购商放心的制造能力。",
    proofBody: "从原材料、锁扣系统到出口包装，每个细节都围绕项目稳定交付而设计。",
    waterproof: "防水地板系统", oemShort: "灵活 OEM", compliance: "出口合规", response: "快速响应",
    catalogueEyebrow: "产品目录", catalogueBody: "SPC、WPC 与 LVT 系列采用结构化产品数据管理，支持多语言发布。",
    enquiryEyebrow: "项目咨询", enquiryBody: "请告诉我们产品类型、规格、数量和目标市场，出口团队将为您匹配合适方案。",
    emailHelp: "适合发送规格、图纸、目录需求和项目文件。", whatsappHelp: "适合快速咨询产品、协调样品及跟进进度。",
    startConversation: "开始沟通", collectionsLabel: "产品系列", whyLabel: "为什么选择 TOOYEI",
    exportMarkets: "出口市场", coreSystems: "核心地板系统", flexibleSpecs: "灵活规格定制", projectService: "项目优先服务",
    builtForMarket: "围绕您的市场进行定制。", oemBody: "尺寸、耐磨层、表面纹理、花色、底垫、锁扣和包装均可定制；新内容平台将每个选项作为结构化数据管理。",
    readyTitle: "准备采购下一批地板产品？", location: "中国江苏常州",
  },
  en: {
    products: "Products", company: "Company", oem: "OEM & ODM", resources: "Resources", contact: "Contact",
    heroEyebrow: "FLOORING MANUFACTURER · SINCE 2015", heroTitle: "Flooring built for ambitious spaces.",
    heroBody: "Factory-direct SPC, WPC, LVT and laminate flooring with stable quality, flexible OEM support and export-ready service.",
    explore: "Explore products", discuss: "Discuss your project", featured: "Featured collections",
    featuredBody: "Selected for waterproof performance, authentic texture and project versatility—helping sourcing teams find the right collection for each market.",
    viewAll: "View all products", viewProduct: "View product", proof: "Manufacturing that gives buyers confidence.",
    proofBody: "From material selection to locking systems and export packaging, each detail is designed around reliable project delivery.",
    waterproof: "Waterproof systems", oemShort: "OEM flexibility", compliance: "Export compliance", response: "Responsive service",
  },
  es: {
    products: "Productos", company: "Empresa", oem: "OEM y ODM", resources: "Recursos", contact: "Contacto",
    heroEyebrow: "FABRICANTE DE SUELOS · DESDE 2015", heroTitle: "Suelos creados para espacios ambiciosos.",
    heroBody: "Suelos SPC, WPC, LVT y laminados directos de fábrica, con calidad estable, servicio OEM flexible y soporte para exportación.",
    explore: "Ver productos", discuss: "Hablemos de su proyecto", featured: "Colecciones destacadas",
    featuredBody: "Productos seleccionados por su impermeabilidad, textura auténtica y versatilidad para encontrar la colección adecuada para cada mercado.",
    viewAll: "Ver todos los productos", viewProduct: "Ver producto", proof: "Fabricación que inspira confianza.",
    proofBody: "Desde los materiales hasta el embalaje de exportación, cada detalle está pensado para una entrega fiable.",
    waterproof: "Sistemas impermeables", oemShort: "Flexibilidad OEM", compliance: "Cumplimiento exportador", response: "Servicio ágil",
  },
  de: {
    products: "Produkte", company: "Unternehmen", oem: "OEM & ODM", resources: "Ressourcen", contact: "Kontakt",
    heroEyebrow: "BODENHERSTELLER · SEIT 2015", heroTitle: "Bodenbeläge für anspruchsvolle Räume.",
    heroBody: "SPC-, WPC-, LVT- und Laminatböden direkt vom Werk – mit stabiler Qualität, flexiblem OEM-Service und Exportkompetenz.",
    explore: "Produkte entdecken", discuss: "Projekt besprechen", featured: "Ausgewählte Kollektionen",
    featuredBody: "Ausgewählt für Wasserfestigkeit, authentische Oberflächen und vielseitige Projekte – passend für unterschiedliche Märkte.",
    viewAll: "Alle Produkte", viewProduct: "Produkt ansehen", proof: "Fertigung, der Einkäufer vertrauen.",
    proofBody: "Von der Materialauswahl bis zur Exportverpackung ist jedes Detail auf zuverlässige Projektabwicklung ausgelegt.",
    waterproof: "Wasserfeste Systeme", oemShort: "Flexible OEM-Lösungen", compliance: "Export-Compliance", response: "Schneller Service",
  },
};

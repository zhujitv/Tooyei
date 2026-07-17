import type { ContentLocale, Locale } from "@/lib/site";

export type LocalizedText = { en: string; zh: string } & Partial<Record<Locale, string>>;

export const readLocalizedText = (text: LocalizedText, locale: Locale) =>
  text[locale]?.trim() || text.en?.trim() || text.zh;

export type ProductFeatureItem = LocalizedText & {
  description?: LocalizedText;
  icon?: string;
};

export type ProductMediaItem = {
  url: string;
  alt: string;
  altLocalized?: LocalizedText;
  role: "PRIMARY" | "GALLERY" | "DETAIL" | "APPLICATION" | "PACKAGING" | "VIDEO";
  caption?: string;
  captionLocalized?: LocalizedText;
};

export type ProductApplicationItem = {
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  imageAlt?: string;
  imageAltLocalized?: LocalizedText;
};

export type ProductDownloadItem = {
  title: LocalizedText;
  description?: LocalizedText;
  url: string;
  kind: "CATALOG" | "SPEC_SHEET" | "INSTALLATION_GUIDE" | "WARRANTY" | "CERTIFICATE" | "OTHER";
};

export type ProductCategoryReference = {
  slug: string;
  name: LocalizedText;
  parent?: { slug: string; name: LocalizedText } | null;
};

export type Product = {
  slug: string;
  sku: string;
  category: string;
  primaryCategory?: ProductCategoryReference;
  categories?: ProductCategoryReference[];
  title: LocalizedText;
  summary: LocalizedText;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  image: string;
  media?: ProductMediaItem[];
  features: ProductFeatureItem[];
  specifications: {
    group?: string;
    groupLocalized?: LocalizedText;
    label: LocalizedText;
    value: string;
    displayValue?: LocalizedText;
    unit?: string;
  }[];
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

export const copy: Record<ContentLocale, Record<string, string>> = {
  en: {
    products: "Products", company: "Company", oem: "OEM & ODM", resources: "Resources", contact: "Contact",
    heroEyebrow: "FLOORING MANUFACTURER · SINCE 2015", heroTitle: "Flooring built for ambitious spaces.",
    heroBody: "Factory-direct SPC, WPC, LVT and laminate flooring with stable quality, flexible OEM support and export-ready service.",
    explore: "Explore products", discuss: "Discuss your project", featured: "Featured collections",
    featuredBody: "Selected for waterproof performance, authentic texture and project versatility—helping sourcing teams find the right collection for each market.",
    viewAll: "View all products", viewProduct: "View product", proof: "Manufacturing that gives buyers confidence.",
    proofBody: "From material selection to locking systems and export packaging, each detail is designed around reliable project delivery.",
    waterproof: "Waterproof systems", oemShort: "OEM flexibility", compliance: "Export compliance", response: "Responsive service",
    catalogueEyebrow: "PRODUCT CATALOGUE", catalogueBody: "SPC, WPC and LVT collections managed with structured product data and multilingual publishing.",
    enquiryEyebrow: "PROJECT ENQUIRY", enquiryBody: "Tell us the product type, specification, quantity and target market. Our export team will recommend the right solution.",
    emailHelp: "Best for specifications, drawings, catalogue requests and project files.", whatsappHelp: "Best for quick product questions, samples and progress updates.",
    startConversation: "Start a conversation", collectionsLabel: "Product collections", whyLabel: "Why TOOYEI",
    exportMarkets: "Export markets", coreSystems: "Core flooring systems", flexibleSpecs: "Flexible specifications", projectService: "Project-first service",
    builtForMarket: "Configured around your market.", oemBody: "Dimensions, wear layers, textures, decors, underlays, locking systems and packaging can all be configured and managed as structured data.",
    readyTitle: "Ready to source your next flooring collection?", location: "Changzhou, Jiangsu, China",
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
    catalogueEyebrow: "PRODUKTKATALOG", catalogueBody: "SPC-, WPC- und LVT-Kollektionen mit strukturierten Produktdaten und mehrsprachiger Veröffentlichung.",
    enquiryEyebrow: "PROJEKTANFRAGE", enquiryBody: "Nennen Sie uns Produkttyp, Spezifikation, Menge und Zielmarkt. Unser Exportteam empfiehlt die passende Lösung.",
    emailHelp: "Ideal für Spezifikationen, Zeichnungen, Kataloganfragen und Projektdateien.", whatsappHelp: "Ideal für schnelle Produktfragen, Muster und Statusupdates.",
    startConversation: "Gespräch beginnen", collectionsLabel: "Produktkollektionen", whyLabel: "Warum TOOYEI",
    exportMarkets: "Exportmärkte", coreSystems: "Kern-Bodensysteme", flexibleSpecs: "Flexible Spezifikationen", projectService: "Projektorientierter Service",
    builtForMarket: "Für Ihren Markt konfiguriert.", oemBody: "Abmessungen, Nutzschichten, Oberflächen, Dekore, Unterlagen, Klicksysteme und Verpackungen lassen sich flexibel konfigurieren.",
    readyTitle: "Bereit für Ihre nächste Bodenkollektion?", location: "Changzhou, Jiangsu, China",
  },
  fr: {
    products: "Produits", company: "Entreprise", oem: "OEM & ODM", resources: "Ressources", contact: "Contact",
    heroEyebrow: "FABRICANT DE SOLS · DEPUIS 2015", heroTitle: "Des sols conçus pour des espaces ambitieux.",
    heroBody: "Sols SPC, WPC, LVT et stratifiés en direct d’usine, avec une qualité stable, un service OEM flexible et un accompagnement export.",
    explore: "Découvrir les produits", discuss: "Parler de votre projet", featured: "Collections à la une",
    featuredBody: "Sélectionnées pour leur résistance à l’eau, leurs textures authentiques et leur polyvalence afin de répondre à chaque marché.",
    viewAll: "Voir tous les produits", viewProduct: "Voir le produit", proof: "Une fabrication qui inspire confiance.",
    proofBody: "Du choix des matières à l’emballage export, chaque détail vise une livraison de projet fiable.",
    waterproof: "Systèmes étanches", oemShort: "Flexibilité OEM", compliance: "Conformité export", response: "Service réactif",
    catalogueEyebrow: "CATALOGUE PRODUITS", catalogueBody: "Collections SPC, WPC et LVT gérées avec des données structurées et une publication multilingue.",
    enquiryEyebrow: "DEMANDE DE PROJET", enquiryBody: "Indiquez le type de produit, les spécifications, la quantité et le marché cible. Notre équipe export vous proposera la solution adaptée.",
    emailHelp: "Idéal pour les spécifications, plans, demandes de catalogue et fichiers projet.", whatsappHelp: "Idéal pour les questions rapides, les échantillons et le suivi.",
    startConversation: "Démarrer la discussion", collectionsLabel: "Collections de produits", whyLabel: "Pourquoi TOOYEI",
    exportMarkets: "Marchés export", coreSystems: "Systèmes de sol principaux", flexibleSpecs: "Spécifications flexibles", projectService: "Service orienté projet",
    builtForMarket: "Configuré pour votre marché.", oemBody: "Dimensions, couches d’usure, textures, décors, sous-couches, systèmes de verrouillage et emballages sont configurables.",
    readyTitle: "Prêt à sourcer votre prochaine collection ?", location: "Changzhou, Jiangsu, Chine",
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
    catalogueEyebrow: "CATÁLOGO DE PRODUCTOS", catalogueBody: "Colecciones SPC, WPC y LVT gestionadas con datos estructurados y publicación multilingüe.",
    enquiryEyebrow: "CONSULTA DE PROYECTO", enquiryBody: "Indíquenos el tipo de producto, especificación, cantidad y mercado objetivo. Nuestro equipo de exportación recomendará la solución adecuada.",
    emailHelp: "Ideal para especificaciones, planos, solicitudes de catálogo y archivos de proyecto.", whatsappHelp: "Ideal para consultas rápidas, muestras y seguimiento.",
    startConversation: "Iniciar conversación", collectionsLabel: "Colecciones de productos", whyLabel: "Por qué TOOYEI",
    exportMarkets: "Mercados de exportación", coreSystems: "Sistemas de suelo principales", flexibleSpecs: "Especificaciones flexibles", projectService: "Servicio orientado a proyectos",
    builtForMarket: "Configurado para su mercado.", oemBody: "Dimensiones, capas de uso, texturas, diseños, bases, sistemas de clic y embalajes pueden configurarse de forma flexible.",
    readyTitle: "¿Listo para su próxima colección de suelos?", location: "Changzhou, Jiangsu, China",
  },
  ru: {
    products: "Продукция", company: "Компания", oem: "OEM и ODM", resources: "Ресурсы", contact: "Контакты",
    heroEyebrow: "ПРОИЗВОДИТЕЛЬ НАПОЛЬНЫХ ПОКРЫТИЙ · С 2015 ГОДА", heroTitle: "Напольные покрытия для амбициозных пространств.",
    heroBody: "SPC, WPC, LVT и ламинат напрямую с завода: стабильное качество, гибкий OEM и готовый экспортный сервис.",
    explore: "Смотреть продукцию", discuss: "Обсудить проект", featured: "Избранные коллекции",
    featuredBody: "Коллекции с водостойкостью, естественной фактурой и гибкостью для проектов разных рынков.",
    viewAll: "Все продукты", viewProduct: "Смотреть продукт", proof: "Производство, которому доверяют закупщики.",
    proofBody: "От выбора сырья до замковых систем и экспортной упаковки — каждая деталь рассчитана на надёжную поставку.",
    waterproof: "Водостойкие системы", oemShort: "Гибкий OEM", compliance: "Экспортное соответствие", response: "Быстрый сервис",
    catalogueEyebrow: "КАТАЛОГ ПРОДУКЦИИ", catalogueBody: "Коллекции SPC, WPC и LVT со структурированными данными и многоязычной публикацией.",
    enquiryEyebrow: "ЗАПРОС ПО ПРОЕКТУ", enquiryBody: "Сообщите тип продукта, характеристики, объём и целевой рынок. Экспортная команда предложит подходящее решение.",
    emailHelp: "Для характеристик, чертежей, каталогов и проектных файлов.", whatsappHelp: "Для быстрых вопросов, образцов и уточнения статуса.",
    startConversation: "Начать разговор", collectionsLabel: "Коллекции продукции", whyLabel: "Почему TOOYEI",
    exportMarkets: "Экспортные рынки", coreSystems: "Основные системы покрытий", flexibleSpecs: "Гибкие характеристики", projectService: "Сервис для проектов",
    builtForMarket: "Настроено под ваш рынок.", oemBody: "Размеры, защитные слои, фактуры, декоры, подложки, замковые системы и упаковку можно гибко настраивать.",
    readyTitle: "Готовы выбрать следующую коллекцию?", location: "Чанчжоу, Цзянсу, Китай",
  },
  ja: {
    products: "製品", company: "会社情報", oem: "OEM・ODM", resources: "資料", contact: "お問い合わせ",
    heroEyebrow: "フローリングメーカー · 2015年創業", heroTitle: "意欲的な空間のためのフローリング。",
    heroBody: "SPC・WPC・LVT・ラミネート床材を工場直送。安定した品質、柔軟なOEM対応、輸出向けサービスを提供します。",
    explore: "製品を見る", discuss: "プロジェクトを相談", featured: "注目のコレクション",
    featuredBody: "防水性、自然な質感、案件対応力を基準に、各市場に適したコレクションを厳選しています。",
    viewAll: "すべての製品", viewProduct: "製品を見る", proof: "バイヤーの信頼に応える製造力。",
    proofBody: "原材料の選定からロックシステム、輸出梱包まで、安定した納品を見据えて設計しています。",
    waterproof: "防水フロアシステム", oemShort: "柔軟なOEM", compliance: "輸出コンプライアンス", response: "迅速な対応",
    catalogueEyebrow: "製品カタログ", catalogueBody: "SPC・WPC・LVTコレクションを構造化データで管理し、多言語で公開します。",
    enquiryEyebrow: "プロジェクト相談", enquiryBody: "製品タイプ、仕様、数量、対象市場をお知らせください。輸出チームが適切なソリューションをご提案します。",
    emailHelp: "仕様書、図面、カタログ依頼、プロジェクト資料の送付に適しています。", whatsappHelp: "製品の簡単な質問、サンプル調整、進捗確認に適しています。",
    startConversation: "相談を始める", collectionsLabel: "製品コレクション", whyLabel: "TOOYEIが選ばれる理由",
    exportMarkets: "輸出市場", coreSystems: "主要フロアシステム", flexibleSpecs: "柔軟な仕様対応", projectService: "プロジェクト優先対応",
    builtForMarket: "市場に合わせて構成。", oemBody: "寸法、耐摩耗層、表面、柄、下地材、ロック方式、梱包を柔軟に設定できます。",
    readyTitle: "次のフローリング調達を始めませんか？", location: "中国 江蘇省 常州市",
  },
  it: {
    products: "Prodotti", company: "Azienda", oem: "OEM e ODM", resources: "Risorse", contact: "Contatti",
    heroEyebrow: "PRODUTTORE DI PAVIMENTI · DAL 2015", heroTitle: "Pavimenti pensati per spazi ambiziosi.",
    heroBody: "Pavimenti SPC, WPC, LVT e laminati direttamente dalla fabbrica, con qualità costante, OEM flessibile e servizio export.",
    explore: "Esplora i prodotti", discuss: "Parla del tuo progetto", featured: "Collezioni in evidenza",
    featuredBody: "Selezionate per impermeabilità, texture autentiche e versatilità, per rispondere alle esigenze di ogni mercato.",
    viewAll: "Vedi tutti i prodotti", viewProduct: "Vedi prodotto", proof: "Una produzione che dà fiducia agli acquirenti.",
    proofBody: "Dalla scelta dei materiali all’imballaggio export, ogni dettaglio è progettato per consegne affidabili.",
    waterproof: "Sistemi impermeabili", oemShort: "Flessibilità OEM", compliance: "Conformità export", response: "Servizio reattivo",
    catalogueEyebrow: "CATALOGO PRODOTTI", catalogueBody: "Collezioni SPC, WPC e LVT gestite con dati strutturati e pubblicazione multilingue.",
    enquiryEyebrow: "RICHIESTA PROGETTO", enquiryBody: "Indicaci tipo di prodotto, specifiche, quantità e mercato. Il team export proporrà la soluzione adatta.",
    emailHelp: "Ideale per specifiche, disegni, cataloghi e file di progetto.", whatsappHelp: "Ideale per domande rapide, campioni e aggiornamenti.",
    startConversation: "Avvia la conversazione", collectionsLabel: "Collezioni di prodotti", whyLabel: "Perché TOOYEI",
    exportMarkets: "Mercati export", coreSystems: "Sistemi di pavimentazione", flexibleSpecs: "Specifiche flessibili", projectService: "Servizio orientato ai progetti",
    builtForMarket: "Configurato per il tuo mercato.", oemBody: "Dimensioni, strati d’usura, texture, decori, sottopavimenti, incastri e imballaggi sono configurabili.",
    readyTitle: "Pronto per la prossima collezione?", location: "Changzhou, Jiangsu, Cina",
  },
  ar: {
    products: "المنتجات", company: "الشركة", oem: "OEM وODM", resources: "الموارد", contact: "اتصل بنا",
    heroEyebrow: "مصنّع أرضيات · منذ 2015", heroTitle: "أرضيات مصممة للمساحات الطموحة.",
    heroBody: "أرضيات SPC وWPC وLVT واللامينيت مباشرة من المصنع، بجودة مستقرة ودعم OEM مرن وخدمة جاهزة للتصدير.",
    explore: "استكشف المنتجات", discuss: "ناقش مشروعك", featured: "تشكيلات مختارة",
    featuredBody: "مختارة لمقاومة الماء والملمس الطبيعي والمرونة في المشاريع بما يناسب احتياجات كل سوق.",
    viewAll: "عرض كل المنتجات", viewProduct: "عرض المنتج", proof: "تصنيع يمنح المشترين الثقة.",
    proofBody: "من اختيار المواد إلى أنظمة القفل وتغليف التصدير، صُممت كل التفاصيل لضمان تسليم موثوق.",
    waterproof: "أنظمة مقاومة للماء", oemShort: "مرونة OEM", compliance: "امتثال التصدير", response: "خدمة سريعة",
    catalogueEyebrow: "كتالوج المنتجات", catalogueBody: "تشكيلات SPC وWPC وLVT تُدار ببيانات منظمة ونشر متعدد اللغات.",
    enquiryEyebrow: "استفسار مشروع", enquiryBody: "أخبرنا بنوع المنتج والمواصفات والكمية والسوق المستهدف، وسيقترح فريق التصدير الحل المناسب.",
    emailHelp: "مناسب للمواصفات والرسومات وطلبات الكتالوج وملفات المشروع.", whatsappHelp: "مناسب للأسئلة السريعة والعينات ومتابعة التقدم.",
    startConversation: "ابدأ المحادثة", collectionsLabel: "تشكيلات المنتجات", whyLabel: "لماذا TOOYEI",
    exportMarkets: "أسواق التصدير", coreSystems: "أنظمة الأرضيات الأساسية", flexibleSpecs: "مواصفات مرنة", projectService: "خدمة تركز على المشروع",
    builtForMarket: "مهيأ لسوقك.", oemBody: "يمكن تخصيص الأبعاد وطبقات الحماية والملمس والتصاميم والطبقات السفلية وأنظمة القفل والتغليف.",
    readyTitle: "هل أنت مستعد لتوريد تشكيلتك التالية؟", location: "تشانغتشو، جيانغسو، الصين",
  },
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
};

import type { Locale } from "@/lib/site";

export type LocalizedText = Record<Locale, string>;

export type Product = {
  slug: string;
  sku: string;
  category: string;
  title: LocalizedText;
  summary: LocalizedText;
  image: string;
  features: LocalizedText[];
  specifications: { label: LocalizedText; value: string }[];
};

export const products: Product[] = [
  {
    slug: "ty602-tile-spc-flooring",
    sku: "TY602",
    category: "SPC",
    title: {
      en: "Rustic Slate Tile SPC Flooring",
      es: "Suelo SPC efecto pizarra rústica",
      de: "Rustikaler Schiefer-SPC-Fliesenboden",
    },
    summary: {
      en: "A natural slate look on a waterproof rigid core, designed for stable installation in residential and commercial interiors.",
      es: "Aspecto de pizarra natural sobre un núcleo rígido e impermeable para interiores residenciales y comerciales.",
      de: "Natürliche Schieferoptik auf einem wasserfesten Rigid-Core für Wohn- und Gewerberäume.",
    },
    image: "/media/product-tile-spc.png",
    features: [
      { en: "100% waterproof", es: "100 % impermeable", de: "100 % wasserfest" },
      { en: "Scratch resistant", es: "Resistente a rayones", de: "Kratzfest" },
      { en: "Click-lock installation", es: "Instalación click", de: "Klick-Verlegung" },
    ],
    specifications: [
      { label: { en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "Stone texture" },
      { label: { en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { en: "Application", es: "Aplicación", de: "Anwendung" }, value: "Residential / Commercial" },
    ],
  },
  {
    slug: "waterproof-eir-spc-click-flooring",
    sku: "EIR-SPC",
    category: "SPC",
    title: { en: "EIR SPC Click Flooring", es: "Suelo SPC click EIR", de: "EIR SPC Klickboden" },
    summary: {
      en: "Registered embossing aligns grain and texture for a convincing timber finish with rigid-core performance.",
      es: "El relieve sincronizado alinea veta y textura para lograr un acabado de madera convincente.",
      de: "Synchronprägung verbindet Maserung und Struktur zu einer authentischen Holzoberfläche.",
    },
    image: "/media/product-eir-spc.png",
    features: [
      { en: "Embossed in register", es: "Relieve sincronizado", de: "Synchronprägung" },
      { en: "Low maintenance", es: "Fácil mantenimiento", de: "Pflegeleicht" },
      { en: "Stable rigid core", es: "Núcleo rígido estable", de: "Stabiler Rigid-Core" },
    ],
    specifications: [
      { label: { en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "EIR wood grain" },
      { label: { en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { en: "Installation", es: "Instalación", de: "Verlegung" }, value: "Click lock" },
    ],
  },
  {
    slug: "vinyl-herringbone-stone-plastic-flooring",
    sku: "HB-SPC",
    category: "SPC",
    title: { en: "Herringbone SPC Flooring", es: "Suelo SPC en espiga", de: "Fischgrät-SPC-Boden" },
    summary: {
      en: "A classic herringbone composition engineered for waterproof performance and demanding daily use.",
      es: "Composición clásica en espiga diseñada para resistir el agua y el uso diario intensivo.",
      de: "Klassisches Fischgrätbild mit wasserfester Konstruktion für intensive tägliche Nutzung.",
    },
    image: "/media/product-herringbone.png",
    features: [
      { en: "Herringbone pattern", es: "Patrón en espiga", de: "Fischgrätmuster" },
      { en: "High traffic ready", es: "Para alto tránsito", de: "Für hohe Beanspruchung" },
      { en: "Waterproof", es: "Impermeable", de: "Wasserfest" },
    ],
    specifications: [
      { label: { en: "Pattern", es: "Patrón", de: "Muster" }, value: "Herringbone" },
      { label: { en: "Core", es: "Núcleo", de: "Kern" }, value: "SPC rigid core" },
      { label: { en: "Use", es: "Uso", de: "Nutzung" }, value: "Heavy residential / Commercial" },
    ],
  },
  {
    slug: "waterproof-oak-wpc-flooring",
    sku: "OAK-WPC",
    category: "WPC",
    title: { en: "Waterproof Oak WPC Flooring", es: "Suelo WPC roble impermeable", de: "Wasserfester Eiche-WPC-Boden" },
    summary: {
      en: "Warm oak visuals paired with a resilient WPC core for comfortable, quiet interiors.",
      es: "Diseño de roble cálido con núcleo WPC resistente para interiores cómodos y silenciosos.",
      de: "Warme Eichenoptik mit elastischem WPC-Kern für komfortable, ruhige Innenräume.",
    },
    image: "/media/product-wpc.png",
    features: [
      { en: "Comfort underfoot", es: "Confort al pisar", de: "Angenehmes Laufgefühl" },
      { en: "Sound reducing", es: "Reducción acústica", de: "Schalldämmend" },
      { en: "Water resistant", es: "Resistente al agua", de: "Wasserbeständig" },
    ],
    specifications: [
      { label: { en: "Surface", es: "Superficie", de: "Oberfläche" }, value: "Oak wood grain" },
      { label: { en: "Core", es: "Núcleo", de: "Kern" }, value: "WPC core" },
      { label: { en: "Installation", es: "Instalación", de: "Verlegung" }, value: "Floating click" },
    ],
  },
  {
    slug: "wood-look-lvt-flooring",
    sku: "WOOD-LVT",
    category: "LVT",
    title: { en: "Wood Look LVT Flooring", es: "Suelo LVT efecto madera", de: "LVT-Boden in Holzoptik" },
    summary: {
      en: "Detailed wood visuals in a versatile LVT format for retail, hospitality and residential specifications.",
      es: "Acabado de madera detallado en formato LVT para proyectos residenciales, hoteleros y comerciales.",
      de: "Detailreiche Holzoptik im vielseitigen LVT-Format für Wohnen, Handel und Hotellerie.",
    },
    image: "/media/product-lvt.png",
    features: [
      { en: "Natural wood look", es: "Aspecto de madera natural", de: "Natürliche Holzoptik" },
      { en: "Easy care", es: "Fácil de cuidar", de: "Pflegeleicht" },
      { en: "Project ready", es: "Ideal para proyectos", de: "Projektgeeignet" },
    ],
    specifications: [
      { label: { en: "Finish", es: "Acabado", de: "Finish" }, value: "Wood look" },
      { label: { en: "Material", es: "Material", de: "Material" }, value: "Luxury vinyl tile" },
      { label: { en: "Application", es: "Aplicación", de: "Anwendung" }, value: "Residential / Hospitality / Retail" },
    ],
  },
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const copy: Record<Locale, Record<string, string>> = {
  en: {
    products: "Products", company: "Company", oem: "OEM & ODM", resources: "Resources", contact: "Contact",
    heroEyebrow: "FLOORING MANUFACTURER · SINCE 2015", heroTitle: "Flooring built for ambitious spaces.",
    heroBody: "Factory-direct SPC, WPC, LVT and laminate flooring with stable quality, flexible OEM support and export-ready service.",
    explore: "Explore products", discuss: "Discuss your project", featured: "Featured collections",
    featuredBody: "A first migration sample from the current catalogue, rebuilt as structured multilingual content.",
    viewAll: "View all products", viewProduct: "View product", proof: "Manufacturing that gives buyers confidence.",
    proofBody: "From material selection to locking systems and export packaging, each detail is designed around reliable project delivery.",
    waterproof: "Waterproof systems", oemShort: "OEM flexibility", compliance: "Export compliance", response: "Responsive service",
  },
  es: {
    products: "Productos", company: "Empresa", oem: "OEM y ODM", resources: "Recursos", contact: "Contacto",
    heroEyebrow: "FABRICANTE DE SUELOS · DESDE 2015", heroTitle: "Suelos creados para espacios ambiciosos.",
    heroBody: "Suelos SPC, WPC, LVT y laminados directos de fábrica, con calidad estable, servicio OEM flexible y soporte para exportación.",
    explore: "Ver productos", discuss: "Hablemos de su proyecto", featured: "Colecciones destacadas",
    featuredBody: "Primera muestra migrada del catálogo actual como contenido multilingüe estructurado.",
    viewAll: "Ver todos los productos", viewProduct: "Ver producto", proof: "Fabricación que inspira confianza.",
    proofBody: "Desde los materiales hasta el embalaje de exportación, cada detalle está pensado para una entrega fiable.",
    waterproof: "Sistemas impermeables", oemShort: "Flexibilidad OEM", compliance: "Cumplimiento exportador", response: "Servicio ágil",
  },
  de: {
    products: "Produkte", company: "Unternehmen", oem: "OEM & ODM", resources: "Ressourcen", contact: "Kontakt",
    heroEyebrow: "BODENHERSTELLER · SEIT 2015", heroTitle: "Bodenbeläge für anspruchsvolle Räume.",
    heroBody: "SPC-, WPC-, LVT- und Laminatböden direkt vom Werk – mit stabiler Qualität, flexiblem OEM-Service und Exportkompetenz.",
    explore: "Produkte entdecken", discuss: "Projekt besprechen", featured: "Ausgewählte Kollektionen",
    featuredBody: "Eine erste Migrationsauswahl aus dem bestehenden Katalog als strukturierter mehrsprachiger Inhalt.",
    viewAll: "Alle Produkte", viewProduct: "Produkt ansehen", proof: "Fertigung, der Einkäufer vertrauen.",
    proofBody: "Von der Materialauswahl bis zur Exportverpackung ist jedes Detail auf zuverlässige Projektabwicklung ausgelegt.",
    waterproof: "Wasserfeste Systeme", oemShort: "Flexible OEM-Lösungen", compliance: "Export-Compliance", response: "Schneller Service",
  },
};

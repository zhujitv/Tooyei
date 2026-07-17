import type { Locale } from "@/lib/site";

export const capabilitySlugs = ["manufacturing", "quality-inspection", "laboratory-testing"] as const;
export type CapabilitySlug = (typeof capabilitySlugs)[number];

type CapabilityStep = { title: string; description: string };

export type CapabilityPageCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  introTitle: string;
  introBody: string;
  processTitle: string;
  steps: CapabilityStep[];
  note: string;
  seoTitle: string;
  seoDescription: string;
};

type CapabilitiesCopy = {
  home: string;
  capabilities: string;
  viewDetails: string;
  gallery: string;
  galleryBody: string;
  contact: string;
  hub: {
    eyebrow: string;
    title: string;
    summary: string;
    sectionTitle: string;
    sectionBody: string;
    ctaTitle: string;
    ctaBody: string;
    seoTitle: string;
    seoDescription: string;
  };
  pages: Record<CapabilitySlug, CapabilityPageCopy>;
};

export type CapabilityMedia = {
  hero: string;
  card: string;
  steps: string[];
  gallery: string[];
};

const mediaSeries = (group: string, count: number) =>
  Array.from({ length: count }, (_, index) => `/media/capabilities/${group}/${group}-${String(index + 1).padStart(2, "0")}.webp`);

export const capabilityMedia: Record<CapabilitySlug, CapabilityMedia> = {
  manufacturing: {
    hero: "/media/capabilities/production/production-14.webp",
    card: "/media/capabilities/production/production-03.webp",
    steps: [
      "/media/capabilities/production/production-10.webp",
      "/media/capabilities/production/production-06.webp",
      "/media/capabilities/production/production-12.webp",
      "/media/capabilities/production/production-15.webp",
    ],
    gallery: mediaSeries("production", 18),
  },
  "quality-inspection": {
    hero: "/media/capabilities/inspection/inspection-19.webp",
    card: "/media/capabilities/inspection/inspection-10.webp",
    steps: [
      "/media/capabilities/inspection/inspection-02.webp",
      "/media/capabilities/inspection/inspection-10.webp",
      "/media/capabilities/inspection/inspection-06.webp",
      "/media/capabilities/inspection/inspection-16.webp",
      "/media/capabilities/inspection/inspection-12.webp",
    ],
    gallery: mediaSeries("inspection", 19),
  },
  "laboratory-testing": {
    hero: "/media/capabilities/laboratory/laboratory-05.webp",
    card: "/media/capabilities/laboratory/laboratory-03.webp",
    steps: [
      "/media/capabilities/laboratory/laboratory-01.webp",
      "/media/capabilities/laboratory/laboratory-06.webp",
      "/media/capabilities/laboratory/laboratory-02.webp",
      "/media/capabilities/laboratory/laboratory-04.webp",
    ],
    gallery: mediaSeries("laboratory", 8),
  },
};

export const isCapabilitySlug = (value: string): value is CapabilitySlug =>
  capabilitySlugs.includes(value as CapabilitySlug);

export const capabilitiesCopy: Record<Locale, CapabilitiesCopy> = {
  zh: {
    home: "首页", capabilities: "制造与质量", viewDetails: "查看详情", gallery: "现场图集",
    galleryBody: "以下图片均来自本次提供的生产、验货与实验室素材，页面不使用视频。", contact: "咨询项目",
    hub: {
      eyebrow: "制造与质量能力",
      title: "让每一项地板项目背后的过程清晰可见。",
      summary: "通过真实生产、出货验货和实验室图片，展示 TOOYEI 如何围绕产品要求协调制造与质量控制。",
      sectionTitle: "从生产线到最终确认。",
      sectionBody: "三个独立页面分别展示生产协作、出货前验货和实验室测试，帮助采购团队快速了解项目执行方式。",
      ctaTitle: "需要针对您的规格制定质量方案？",
      ctaBody: "告诉我们产品结构、数量和目标市场，我们会在打样与量产前确认对应的检查重点。",
      seoTitle: "制造、验货与实验室能力",
      seoDescription: "了解 TOOYEI 的地板生产协作、出货前质量检查和实验室测试能力。",
    },
    pages: {
      manufacturing: {
        eyebrow: "生产协作", title: "围绕产品要求组织生产。",
        summary: "通过真实生产线和加工环节，了解我们所协调的地板项目如何从板材成型走向包装交付。",
        introTitle: "以已确认的产品方案为起点。",
        introBody: "生产围绕结构、花色、表面、锁扣、底垫、包装和目标市场要求进行协调。页面展示的是相关项目所使用生产网络中的现场图片，不夸大自有规模。",
        processTitle: "典型生产流程",
        steps: [
          { title: "基材与板材成型", description: "根据已确认的结构要求控制配方、成型和板材状态。" },
          { title: "花色与表面处理", description: "将装饰膜、耐磨层和表面效果与确认样保持一致。" },
          { title: "开槽与过程流转", description: "切割、锁扣加工和过程周转为最终检查做好准备。" },
          { title: "包装与放行", description: "按项目要求完成包装，并在出货前进入验货环节。" },
        ],
        note: "具体生产流程会随 SPC、WPC、LVT、强化地板及定制结构而调整。",
        seoTitle: "地板生产与制造协作", seoDescription: "查看 TOOYEI 地板项目的生产线、表面处理、开槽和包装流程。",
      },
      "quality-inspection": {
        eyebrow: "出货前验货", title: "把检查落实到可见的细节。",
        summary: "从样板比对、尺寸测量到表面、包装和标签检查，用清晰步骤降低批量交付风险。",
        introTitle: "检查项目来自已确认的规格。",
        introBody: "验货不是简单拍照，而是将样板、订单规格、包装要求和量产状态逐项核对，并记录需要复核的问题。",
        processTitle: "典型验货节点",
        steps: [
          { title: "样板与大货比对", description: "核对花色、纹理、倒角和整体视觉是否与确认样一致。" },
          { title: "尺寸与厚度", description: "抽查长度、宽度、总厚度等关键尺寸。" },
          { title: "拼接与表面", description: "检查拼缝、锁扣配合、倒角和表面效果。" },
          { title: "耐磨层与光泽", description: "按项目要求检查耐磨层与表面光泽等指标。" },
          { title: "包装、标识与托盘", description: "核对外箱、喷码、标签、保护方式和托盘状态。" },
        ],
        note: "图片中的数值仅对应当次抽检样品，不能替代具体订单的规格书或检验报告。",
        seoTitle: "地板出货验货与质量检查", seoDescription: "查看地板样板比对、尺寸厚度、拼接表面及包装标识检查流程。",
      },
      "laboratory-testing": {
        eyebrow: "实验室测试", title: "用测试支持产品判断。",
        summary: "展示用于地板样品评估、机械性能、表面性能和材料检查的实验室环境与设备。",
        introTitle: "测试范围随产品和市场要求确定。",
        introBody: "实验室工作用于支持样品确认、生产验证和项目文件准备。具体测试项目、方法和判定标准应在每个项目中单独确认。",
        processTitle: "主要测试方向",
        steps: [
          { title: "环境调节与稳定性", description: "观察材料在设定环境条件下的尺寸和状态变化。" },
          { title: "机械与锁扣性能", description: "评估样品的受力、连接和结构表现。" },
          { title: "表面与耐磨表现", description: "根据产品要求进行表面、摩擦和耐磨相关检查。" },
          { title: "材料与化学项目", description: "按目标市场与项目要求安排材料或化学相关测试。" },
        ],
        note: "页面不据此宣称实验室认证或特定标准合格；相关资质与报告须在项目文件中单独确认。",
        seoTitle: "地板实验室与产品测试", seoDescription: "了解地板环境稳定性、机械性能、表面耐磨及材料测试环境。",
      },
    },
  },
  en: {
    home: "Home", capabilities: "Manufacturing & quality", viewDetails: "View details", gallery: "On-site gallery",
    galleryBody: "Every image comes from the supplied production, inspection and laboratory material. No video is used.", contact: "Discuss a project",
    hub: {
      eyebrow: "Manufacturing and quality",
      title: "A visible process behind every flooring programme.",
      summary: "Real production, shipment inspection and laboratory images show how TOOYEI coordinates manufacturing and quality around the product brief.",
      sectionTitle: "From the production line to final verification.",
      sectionBody: "Three focused pages explain manufacturing coordination, pre-shipment inspection and laboratory testing for sourcing teams.",
      ctaTitle: "Need a quality plan for your specification?",
      ctaBody: "Share the construction, volume and target market so inspection priorities can be confirmed before sampling and production.",
      seoTitle: "Manufacturing, inspection and laboratory capabilities",
      seoDescription: "Explore TOOYEI flooring manufacturing coordination, pre-shipment inspection and laboratory testing capabilities.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Manufacturing coordination", title: "Production organised around the product brief.",
        summary: "A real-world view of the production lines and finishing stages used to move flooring programmes from board formation to packed delivery.",
        introTitle: "Starting with the approved product programme.",
        introBody: "Production is coordinated around construction, decor, surface, locking, backing, packaging and target-market requirements. The facilities shown form part of the production network used for relevant projects; no inflated ownership claim is intended.",
        processTitle: "Typical production flow",
        steps: [
          { title: "Core and board formation", description: "Formulation, forming and board condition are controlled against the approved construction." },
          { title: "Decor and surface finishing", description: "Decor film, wear layer and surface treatment are aligned with the approved sample." },
          { title: "Profiling and in-process handling", description: "Cutting, click profiling and controlled handling prepare boards for final checks." },
          { title: "Packing and release", description: "Products are packed to the project requirement before pre-shipment inspection." },
        ],
        note: "The exact flow varies across SPC, WPC, LVT, laminate and customised constructions.",
        seoTitle: "Flooring manufacturing and production coordination", seoDescription: "See flooring production lines, surface finishing, profiling and packing coordinated by TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "Pre-shipment inspection", title: "Quality checks made visible.",
        summary: "A clear sequence from approved-sample comparison and dimensional checks to surface, packing and label review.",
        introTitle: "Inspection criteria start with the approved specification.",
        introBody: "Inspection is more than taking photographs. The approved sample, order specification, packaging brief and production condition are checked item by item, with exceptions recorded for review.",
        processTitle: "Typical inspection points",
        steps: [
          { title: "Approved sample comparison", description: "Review decor, texture, bevel and overall appearance against the approved sample." },
          { title: "Dimensions and thickness", description: "Spot-check length, width, total thickness and other critical dimensions." },
          { title: "Joints and surface", description: "Review joint fit, locking, bevel details and surface appearance." },
          { title: "Wear layer and gloss", description: "Check wear-layer and surface-gloss requirements where specified." },
          { title: "Packing, marking and pallets", description: "Confirm cartons, printing, labels, protective details and pallet condition." },
        ],
        note: "Values visible in photographs relate only to the sample checked and do not replace the order specification or inspection report.",
        seoTitle: "Flooring pre-shipment inspection and quality control", seoDescription: "See flooring sample, dimension, thickness, surface, label and packing inspection steps.",
      },
      "laboratory-testing": {
        eyebrow: "Laboratory testing", title: "Testing that supports product decisions.",
        summary: "A view of laboratory environments and equipment used to evaluate flooring samples, mechanical behaviour, surfaces and materials.",
        introTitle: "The test scope follows the product and market.",
        introBody: "Laboratory work supports sample approval, production verification and project documentation. Test items, methods and acceptance criteria are confirmed separately for each programme.",
        processTitle: "Principal test areas",
        steps: [
          { title: "Conditioning and stability", description: "Observe dimensional and physical changes under defined environmental conditions." },
          { title: "Mechanical and locking performance", description: "Evaluate loading, connection and structural behaviour of prepared samples." },
          { title: "Surface and wear behaviour", description: "Perform surface, friction and wear-related checks according to the product brief." },
          { title: "Material and chemical items", description: "Arrange material or chemical testing according to project and target-market needs." },
        ],
        note: "These images do not by themselves claim laboratory accreditation or compliance with a named standard; credentials and reports are confirmed in project documentation.",
        seoTitle: "Flooring laboratory and product testing", seoDescription: "Explore flooring conditioning, mechanical, surface-wear and material testing environments.",
      },
    },
  },
  de: {
    home: "Startseite", capabilities: "Fertigung & Qualität", viewDetails: "Details ansehen", gallery: "Bilder vor Ort",
    galleryBody: "Alle Bilder stammen aus den bereitgestellten Produktions-, Prüf- und Labormaterialien. Es werden keine Videos verwendet.", contact: "Projekt besprechen",
    hub: {
      eyebrow: "Fertigung und Qualität", title: "Ein sichtbarer Prozess hinter jedem Bodenprogramm.",
      summary: "Reale Bilder aus Produktion, Versandprüfung und Labor zeigen, wie TOOYEI Fertigung und Qualität am Produktbriefing ausrichtet.",
      sectionTitle: "Von der Produktionslinie bis zur finalen Prüfung.", sectionBody: "Drei Seiten erläutern Fertigungskoordination, Vorversandkontrolle und Labortests für Einkaufsteams.",
      ctaTitle: "Benötigen Sie einen Qualitätsplan für Ihre Spezifikation?", ctaBody: "Teilen Sie Aufbau, Menge und Zielmarkt mit, damit Prüfschwerpunkte vor Musterung und Produktion festgelegt werden.",
      seoTitle: "Fertigung, Inspektion und Labor", seoDescription: "Entdecken Sie TOOYEI Fertigungskoordination, Vorversandprüfung und Labortests für Bodenbeläge.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Fertigungskoordination", title: "Produktion nach dem Produktbriefing.", summary: "Reale Einblicke in Produktionslinien und Veredelungsstufen vom Plattenaufbau bis zur verpackten Lieferung.",
        introTitle: "Ausgangspunkt ist das freigegebene Produktprogramm.", introBody: "Die Produktion wird nach Aufbau, Dekor, Oberfläche, Verriegelung, Unterlage, Verpackung und Zielmarkt koordiniert. Die gezeigten Anlagen sind Teil des für relevante Projekte genutzten Produktionsnetzwerks.",
        processTitle: "Typischer Produktionsablauf", steps: [
          { title: "Kern- und Plattenformung", description: "Rezeptur, Formung und Plattenzustand werden am freigegebenen Aufbau ausgerichtet." },
          { title: "Dekor und Oberflächenfinish", description: "Dekorfilm, Nutzschicht und Oberflächenbehandlung werden mit dem Freigabemuster abgestimmt." },
          { title: "Profilierung und Handling", description: "Zuschnitt, Klickprofilierung und kontrollierter Transport bereiten die Platten auf die Endkontrolle vor." },
          { title: "Verpackung und Freigabe", description: "Die Ware wird projektspezifisch verpackt und anschließend vor dem Versand geprüft." },
        ], note: "Der genaue Ablauf variiert bei SPC, WPC, LVT, Laminat und Sonderaufbauten.",
        seoTitle: "Bodenfertigung und Produktionskoordination", seoDescription: "Produktionslinien, Oberflächenfinish, Profilierung und Verpackung von Bodenbelägen.",
      },
      "quality-inspection": {
        eyebrow: "Vorversandprüfung", title: "Qualitätskontrolle sichtbar gemacht.", summary: "Vom Vergleich mit dem Freigabemuster über Maßprüfungen bis zur Kontrolle von Oberfläche, Verpackung und Etiketten.",
        introTitle: "Prüfkriterien beginnen mit der freigegebenen Spezifikation.", introBody: "Muster, Auftragsspezifikation, Verpackungsvorgaben und Produktionszustand werden Punkt für Punkt verglichen und Abweichungen dokumentiert.",
        processTitle: "Typische Prüfpunkte", steps: [
          { title: "Vergleich mit Freigabemuster", description: "Dekor, Struktur, Fase und Gesamterscheinung werden mit dem Muster verglichen." },
          { title: "Abmessungen und Dicke", description: "Länge, Breite, Gesamtdicke und weitere kritische Maße werden stichprobenartig geprüft." },
          { title: "Fugen und Oberfläche", description: "Passung, Verriegelung, Fasendetails und Oberflächenbild werden bewertet." },
          { title: "Nutzschicht und Glanz", description: "Vorgegebene Anforderungen an Nutzschicht und Oberflächenglanz werden geprüft." },
          { title: "Verpackung und Kennzeichnung", description: "Kartons, Druck, Etiketten, Schutz und Palettenzustand werden bestätigt." },
        ], note: "Sichtbare Messwerte gelten nur für die geprüfte Probe und ersetzen keine Spezifikation oder Prüfberichte.",
        seoTitle: "Vorversandprüfung und Qualitätskontrolle", seoDescription: "Prüfung von Muster, Maßen, Dicke, Oberfläche, Etiketten und Verpackung.",
      },
      "laboratory-testing": {
        eyebrow: "Labortests", title: "Tests als Grundlage für Produktentscheidungen.", summary: "Labore und Geräte zur Bewertung von Bodenmustern, Mechanik, Oberflächen und Materialien.",
        introTitle: "Der Prüfumfang folgt Produkt und Markt.", introBody: "Laborarbeit unterstützt Musterfreigabe, Produktionsverifizierung und Projektdokumentation. Methoden und Grenzwerte werden projektbezogen bestätigt.",
        processTitle: "Wichtige Prüfbereiche", steps: [
          { title: "Konditionierung und Stabilität", description: "Maß- und Zustandsänderungen unter definierten Umgebungsbedingungen beobachten." },
          { title: "Mechanik und Verriegelung", description: "Belastung, Verbindung und strukturelles Verhalten vorbereiteter Proben bewerten." },
          { title: "Oberfläche und Verschleiß", description: "Oberflächen-, Reibungs- und Verschleißprüfungen gemäß Produktbriefing durchführen." },
          { title: "Material und Chemie", description: "Material- oder Chemietests nach Projekt- und Marktanforderungen veranlassen." },
        ], note: "Die Bilder allein belegen keine Laborakkreditierung oder Normkonformität; Nachweise werden separat bestätigt.",
        seoTitle: "Bodenlabor und Produktprüfung", seoDescription: "Umwelt-, mechanische, Oberflächen- und Materialtests für Bodenbeläge.",
      },
    },
  },
  fr: {
    home: "Accueil", capabilities: "Fabrication et qualité", viewDetails: "Voir les détails", gallery: "Galerie sur site",
    galleryBody: "Toutes les images proviennent des supports de production, d’inspection et de laboratoire fournis. Aucune vidéo n’est utilisée.", contact: "Discuter d’un projet",
    hub: {
      eyebrow: "Fabrication et qualité", title: "Un processus visible derrière chaque programme de sol.",
      summary: "Des images réelles de production, d’inspection avant expédition et de laboratoire montrent comment TOOYEI coordonne fabrication et qualité.",
      sectionTitle: "De la ligne de production à la vérification finale.", sectionBody: "Trois pages présentent la coordination de fabrication, le contrôle avant expédition et les essais en laboratoire.",
      ctaTitle: "Besoin d’un plan qualité adapté à vos spécifications ?", ctaBody: "Indiquez la construction, le volume et le marché cible afin de définir les contrôles avant échantillonnage et production.",
      seoTitle: "Fabrication, inspection et laboratoire", seoDescription: "Découvrez les capacités TOOYEI en fabrication, inspection avant expédition et essais de sols.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Coordination de fabrication", title: "Une production organisée autour du cahier des charges.", summary: "Une vue réelle des lignes et étapes de finition, de la formation des panneaux à la livraison emballée.",
        introTitle: "Le programme produit approuvé comme point de départ.", introBody: "La production est coordonnée selon la structure, le décor, la surface, le système de clic, la sous-couche, l’emballage et le marché. Les sites montrés appartiennent au réseau de production utilisé pour les projets concernés.",
        processTitle: "Flux de production type", steps: [
          { title: "Formation du noyau et du panneau", description: "La formulation, la mise en forme et l’état du panneau suivent la construction approuvée." },
          { title: "Décor et finition de surface", description: "Film décoratif, couche d’usure et traitement de surface sont alignés sur l’échantillon validé." },
          { title: "Profilage et manutention", description: "Découpe, profilage clic et manutention contrôlée préparent les panneaux au contrôle final." },
          { title: "Emballage et libération", description: "Les produits sont emballés selon le projet avant l’inspection d’expédition." },
        ], note: "Le flux varie selon les constructions SPC, WPC, LVT, stratifiées et personnalisées.",
        seoTitle: "Fabrication et coordination de sols", seoDescription: "Lignes de production, finition, profilage et emballage de sols coordonnés par TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "Inspection avant expédition", title: "Des contrôles qualité rendus visibles.", summary: "De la comparaison avec l’échantillon validé aux contrôles dimensionnels, de surface, d’emballage et d’étiquetage.",
        introTitle: "Les critères partent de la spécification approuvée.", introBody: "Échantillon, spécification de commande, consignes d’emballage et état de production sont contrôlés point par point, avec enregistrement des écarts.",
        processTitle: "Points de contrôle types", steps: [
          { title: "Comparaison à l’échantillon", description: "Vérifier décor, texture, chanfrein et aspect général par rapport à l’échantillon approuvé." },
          { title: "Dimensions et épaisseur", description: "Contrôler par sondage longueur, largeur, épaisseur totale et dimensions critiques." },
          { title: "Joints et surface", description: "Examiner l’ajustement, le verrouillage, les chanfreins et l’aspect de surface." },
          { title: "Couche d’usure et brillance", description: "Contrôler les exigences de couche d’usure et de brillance lorsqu’elles sont spécifiées." },
          { title: "Emballage et marquage", description: "Confirmer cartons, impression, étiquettes, protections et état des palettes." },
        ], note: "Les valeurs visibles concernent uniquement l’échantillon contrôlé et ne remplacent ni spécification ni rapport.",
        seoTitle: "Inspection avant expédition des sols", seoDescription: "Contrôle d’échantillon, dimensions, épaisseur, surface, étiquettes et emballage.",
      },
      "laboratory-testing": {
        eyebrow: "Essais en laboratoire", title: "Des essais au service des décisions produit.", summary: "Environnements et équipements utilisés pour évaluer échantillons, comportement mécanique, surfaces et matériaux.",
        introTitle: "Le programme d’essais suit le produit et le marché.", introBody: "Le laboratoire soutient la validation des échantillons, la vérification de production et les documents projet. Méthodes et critères sont confirmés séparément.",
        processTitle: "Principaux domaines d’essai", steps: [
          { title: "Conditionnement et stabilité", description: "Observer les variations dimensionnelles et physiques sous conditions définies." },
          { title: "Mécanique et verrouillage", description: "Évaluer charge, connexion et comportement structurel des échantillons préparés." },
          { title: "Surface et usure", description: "Effectuer des contrôles de surface, friction et usure selon le cahier des charges." },
          { title: "Matériaux et chimie", description: "Organiser les essais matériaux ou chimiques selon le projet et le marché." },
        ], note: "Ces images ne prouvent pas à elles seules une accréditation ou une conformité normative ; les justificatifs sont confirmés séparément.",
        seoTitle: "Laboratoire et essais de sols", seoDescription: "Essais de conditionnement, mécanique, surface, usure et matériaux pour sols.",
      },
    },
  },
  es: {
    home: "Inicio", capabilities: "Fabricación y calidad", viewDetails: "Ver detalles", gallery: "Galería en planta",
    galleryBody: "Todas las imágenes proceden del material de producción, inspección y laboratorio suministrado. No se utilizan vídeos.", contact: "Hablar de un proyecto",
    hub: {
      eyebrow: "Fabricación y calidad", title: "Un proceso visible detrás de cada programa de suelo.",
      summary: "Imágenes reales de producción, inspección previa al envío y laboratorio muestran cómo TOOYEI coordina fabricación y calidad.",
      sectionTitle: "De la línea de producción a la verificación final.", sectionBody: "Tres páginas explican la coordinación de fabricación, la inspección previa al envío y las pruebas de laboratorio.",
      ctaTitle: "¿Necesita un plan de calidad para su especificación?", ctaBody: "Comparta construcción, volumen y mercado para definir las prioridades de inspección antes de muestras y producción.",
      seoTitle: "Fabricación, inspección y laboratorio", seoDescription: "Conozca las capacidades de TOOYEI en fabricación, inspección previa al envío y pruebas de suelos.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Coordinación de fabricación", title: "Producción organizada según el producto.", summary: "Una visión real de líneas y acabados desde la formación de paneles hasta la entrega embalada.",
        introTitle: "Partimos del programa de producto aprobado.", introBody: "La producción se coordina según estructura, diseño, superficie, clic, base, embalaje y mercado. Las instalaciones mostradas forman parte de la red de producción utilizada en los proyectos correspondientes.",
        processTitle: "Flujo de producción habitual", steps: [
          { title: "Formación de núcleo y panel", description: "La formulación, formación y condición del panel siguen la construcción aprobada." },
          { title: "Diseño y acabado superficial", description: "Película decorativa, capa de uso y tratamiento se ajustan a la muestra aprobada." },
          { title: "Perfilado y manipulación", description: "Corte, perfilado clic y manipulación controlada preparan los paneles para el control final." },
          { title: "Embalaje y liberación", description: "El producto se embala según el proyecto antes de la inspección previa al envío." },
        ], note: "El flujo varía entre SPC, WPC, LVT, laminado y estructuras personalizadas.",
        seoTitle: "Fabricación y coordinación de suelos", seoDescription: "Líneas, acabado, perfilado y embalaje de suelos coordinados por TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "Inspección previa al envío", title: "Controles de calidad visibles.", summary: "Desde la comparación con la muestra aprobada hasta dimensiones, superficie, embalaje y etiquetas.",
        introTitle: "Los criterios parten de la especificación aprobada.", introBody: "Muestra, especificación, instrucciones de embalaje y estado de producción se revisan punto por punto, registrando cualquier excepción.",
        processTitle: "Puntos habituales de inspección", steps: [
          { title: "Comparación con la muestra", description: "Revisar diseño, textura, bisel y aspecto general frente a la muestra aprobada." },
          { title: "Dimensiones y espesor", description: "Comprobar longitud, ancho, espesor total y otras dimensiones críticas." },
          { title: "Juntas y superficie", description: "Revisar ajuste, cierre, biseles y aspecto de la superficie." },
          { title: "Capa de uso y brillo", description: "Comprobar la capa de uso y el brillo cuando lo exija la especificación." },
          { title: "Embalaje y marcado", description: "Confirmar cajas, impresión, etiquetas, protección y estado del palé." },
        ], note: "Los valores visibles corresponden solo a la muestra revisada y no sustituyen especificaciones ni informes.",
        seoTitle: "Inspección de suelos antes del envío", seoDescription: "Control de muestra, dimensiones, espesor, superficie, etiquetas y embalaje.",
      },
      "laboratory-testing": {
        eyebrow: "Pruebas de laboratorio", title: "Pruebas que respaldan decisiones de producto.", summary: "Laboratorios y equipos para evaluar muestras, comportamiento mecánico, superficies y materiales.",
        introTitle: "El alcance sigue al producto y al mercado.", introBody: "El laboratorio respalda muestras, verificación de producción y documentación. Métodos y criterios se confirman para cada programa.",
        processTitle: "Áreas principales de prueba", steps: [
          { title: "Acondicionamiento y estabilidad", description: "Observar cambios dimensionales y físicos bajo condiciones ambientales definidas." },
          { title: "Rendimiento mecánico y clic", description: "Evaluar carga, unión y comportamiento estructural de muestras preparadas." },
          { title: "Superficie y desgaste", description: "Realizar controles de superficie, fricción y desgaste según el producto." },
          { title: "Materiales y química", description: "Organizar pruebas de materiales o químicas según proyecto y mercado." },
        ], note: "Las imágenes no acreditan por sí solas el laboratorio ni una norma; credenciales e informes se confirman por separado.",
        seoTitle: "Laboratorio y pruebas de suelos", seoDescription: "Pruebas ambientales, mecánicas, de superficie, desgaste y materiales.",
      },
    },
  },
  ru: {
    home: "Главная", capabilities: "Производство и качество", viewDetails: "Подробнее", gallery: "Фотографии процессов",
    galleryBody: "Все изображения взяты из предоставленных материалов производства, инспекции и лаборатории. Видео не используется.", contact: "Обсудить проект",
    hub: {
      eyebrow: "Производство и качество", title: "Понятный процесс за каждой программой напольных покрытий.",
      summary: "Реальные фотографии производства, инспекции и лаборатории показывают, как TOOYEI координирует качество по техническому заданию.",
      sectionTitle: "От производственной линии до финальной проверки.", sectionBody: "Три страницы раскрывают координацию производства, предпродажную инспекцию и лабораторные испытания.",
      ctaTitle: "Нужен план качества под вашу спецификацию?", ctaBody: "Сообщите конструкцию, объём и рынок, чтобы определить приоритеты контроля до образцов и производства.",
      seoTitle: "Производство, инспекция и лаборатория", seoDescription: "Возможности TOOYEI по производству, инспекции перед отгрузкой и испытаниям покрытий.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Координация производства", title: "Производство по техническому заданию.", summary: "Реальные линии и этапы отделки: от формирования плиты до упакованной поставки.",
        introTitle: "Основа — утверждённая программа продукта.", introBody: "Производство координируется по конструкции, декору, поверхности, замку, подложке, упаковке и рынку. Показанные площадки входят в производственную сеть соответствующих проектов.",
        processTitle: "Типовой производственный поток", steps: [
          { title: "Формирование основы и плиты", description: "Рецептура, формование и состояние плиты контролируются по утверждённой конструкции." },
          { title: "Декор и поверхность", description: "Декоративная плёнка, защитный слой и обработка сверяются с утверждённым образцом." },
          { title: "Профилирование и перемещение", description: "Резка, замковый профиль и аккуратное перемещение готовят панели к финальному контролю." },
          { title: "Упаковка и выпуск", description: "Продукция упаковывается по проекту перед инспекцией отгрузки." },
        ], note: "Точный процесс зависит от SPC, WPC, LVT, ламината и индивидуальной конструкции.",
        seoTitle: "Производство напольных покрытий", seoDescription: "Линии, отделка, профилирование и упаковка напольных покрытий TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "Инспекция перед отгрузкой", title: "Контроль качества в деталях.", summary: "Сравнение с образцом, размеры, поверхность, упаковка и маркировка в понятной последовательности.",
        introTitle: "Критерии определяет утверждённая спецификация.", introBody: "Образец, спецификация заказа, требования к упаковке и состояние партии проверяются по пунктам, а отклонения фиксируются.",
        processTitle: "Типовые точки контроля", steps: [
          { title: "Сравнение с образцом", description: "Проверка декора, текстуры, фаски и общего вида по утверждённому образцу." },
          { title: "Размеры и толщина", description: "Выборочная проверка длины, ширины, общей толщины и критических размеров." },
          { title: "Стыки и поверхность", description: "Проверка стыковки, замка, фаски и внешнего вида поверхности." },
          { title: "Защитный слой и блеск", description: "Контроль защитного слоя и блеска, если они указаны в требованиях." },
          { title: "Упаковка и маркировка", description: "Проверка коробок, печати, этикеток, защиты и паллет." },
        ], note: "Значения на фото относятся только к проверенному образцу и не заменяют спецификацию или отчёт.",
        seoTitle: "Инспекция напольных покрытий", seoDescription: "Проверка образца, размеров, толщины, поверхности, этикеток и упаковки.",
      },
      "laboratory-testing": {
        eyebrow: "Лабораторные испытания", title: "Испытания для обоснованных решений.", summary: "Лабораторные помещения и оборудование для оценки образцов, механики, поверхности и материалов.",
        introTitle: "Объём испытаний зависит от продукта и рынка.", introBody: "Лаборатория поддерживает утверждение образцов, проверку производства и документацию. Методы и критерии согласуются отдельно.",
        processTitle: "Основные направления", steps: [
          { title: "Кондиционирование и стабильность", description: "Наблюдение размерных и физических изменений в заданных условиях." },
          { title: "Механика и замковые соединения", description: "Оценка нагрузки, соединения и структурного поведения подготовленных образцов." },
          { title: "Поверхность и износ", description: "Проверка поверхности, трения и износа по заданию продукта." },
          { title: "Материалы и химия", description: "Организация материальных или химических испытаний по проекту и рынку." },
        ], note: "Фотографии сами по себе не подтверждают аккредитацию или соответствие стандарту; документы проверяются отдельно.",
        seoTitle: "Лаборатория напольных покрытий", seoDescription: "Испытания стабильности, механики, поверхности, износа и материалов.",
      },
    },
  },
  ja: {
    home: "ホーム", capabilities: "製造・品質", viewDetails: "詳細を見る", gallery: "現場ギャラリー",
    galleryBody: "すべての画像は提供された生産・検品・ラボ素材です。動画は使用していません。", contact: "プロジェクトを相談",
    hub: {
      eyebrow: "製造と品質", title: "各フローリング計画の背景にある工程を見える化。",
      summary: "実際の生産、出荷前検品、ラボ画像を通じて、TOOYEIが製品仕様に沿って製造と品質を調整する方法を紹介します。",
      sectionTitle: "生産ラインから最終確認まで。", sectionBody: "製造調整、出荷前検品、ラボ試験を3つのページで分かりやすく紹介します。",
      ctaTitle: "仕様に合った品質計画が必要ですか？", ctaBody: "構成、数量、対象市場を共有いただければ、サンプルと量産前に検査重点を確認します。",
      seoTitle: "製造・検品・ラボ能力", seoDescription: "TOOYEIの床材製造、出荷前検品、ラボ試験能力をご覧ください。",
    },
    pages: {
      manufacturing: {
        eyebrow: "製造調整", title: "製品仕様を中心に組み立てる生産。", summary: "基材成形から仕上げ、梱包まで、実際の生産ラインと工程を紹介します。",
        introTitle: "承認済みの製品計画から開始。", introBody: "構造、柄、表面、クリック、裏材、梱包、対象市場に合わせて生産を調整します。掲載施設は該当案件で利用する生産ネットワークの一部です。",
        processTitle: "代表的な生産フロー", steps: [
          { title: "コア・板材成形", description: "承認された構造に沿って配合、成形、板材状態を管理します。" },
          { title: "柄と表面仕上げ", description: "装飾フィルム、摩耗層、表面処理を承認サンプルに合わせます。" },
          { title: "切削・工程搬送", description: "切断、クリック加工、適切な搬送で最終検査に備えます。" },
          { title: "梱包・出荷判定", description: "案件仕様に沿って梱包し、出荷前検品へ進めます。" },
        ], note: "実際の工程はSPC、WPC、LVT、ラミネート、特注構造により異なります。",
        seoTitle: "床材の製造と生産調整", seoDescription: "床材の生産ライン、表面仕上げ、クリック加工、梱包工程。",
      },
      "quality-inspection": {
        eyebrow: "出荷前検品", title: "品質確認を見える形に。", summary: "承認サンプル比較から寸法、表面、梱包、ラベルまでを順序立てて確認します。",
        introTitle: "検査基準は承認仕様から。", introBody: "サンプル、注文仕様、梱包指示、量産状態を項目ごとに照合し、再確認事項を記録します。",
        processTitle: "主な検品項目", steps: [
          { title: "承認サンプルとの比較", description: "柄、質感、面取り、全体外観を承認サンプルと照合します。" },
          { title: "寸法と厚さ", description: "長さ、幅、総厚、重要寸法を抜き取り確認します。" },
          { title: "継ぎ目と表面", description: "接合、クリック、面取り、表面の状態を確認します。" },
          { title: "摩耗層と光沢", description: "指定がある場合、摩耗層と表面光沢を確認します。" },
          { title: "梱包・表示・パレット", description: "箱、印字、ラベル、保護、パレット状態を確認します。" },
        ], note: "画像内の数値は当該サンプルのみの値で、仕様書や検品報告書の代わりにはなりません。",
        seoTitle: "床材の出荷前検品", seoDescription: "床材サンプル、寸法、厚さ、表面、ラベル、梱包の検品工程。",
      },
      "laboratory-testing": {
        eyebrow: "ラボ試験", title: "製品判断を支える試験。", summary: "床材サンプル、機械性能、表面、材料を評価するラボ環境と設備を紹介します。",
        introTitle: "試験範囲は製品と市場に合わせる。", introBody: "ラボ作業はサンプル承認、量産検証、案件資料を支援します。方法と判定基準は案件ごとに確認します。",
        processTitle: "主な試験分野", steps: [
          { title: "環境調整と安定性", description: "設定環境下で寸法や状態の変化を確認します。" },
          { title: "機械・クリック性能", description: "準備した試料の荷重、接合、構造性能を評価します。" },
          { title: "表面・耐摩耗性能", description: "製品仕様に沿って表面、摩擦、摩耗を確認します。" },
          { title: "材料・化学項目", description: "案件と対象市場に応じて材料または化学試験を手配します。" },
        ], note: "画像だけでラボ認定や特定規格への適合を示すものではありません。証明書と報告書は個別に確認します。",
        seoTitle: "床材ラボと製品試験", seoDescription: "床材の環境安定性、機械、表面、摩耗、材料試験。",
      },
    },
  },
  it: {
    home: "Home", capabilities: "Produzione e qualità", viewDetails: "Vedi dettagli", gallery: "Galleria operativa",
    galleryBody: "Tutte le immagini provengono dai materiali forniti di produzione, ispezione e laboratorio. Non sono usati video.", contact: "Parla del progetto",
    hub: {
      eyebrow: "Produzione e qualità", title: "Un processo visibile dietro ogni programma di pavimentazione.",
      summary: "Immagini reali di produzione, ispezione pre-spedizione e laboratorio mostrano come TOOYEI coordina produzione e qualità.",
      sectionTitle: "Dalla linea alla verifica finale.", sectionBody: "Tre pagine spiegano coordinamento produttivo, controllo pre-spedizione e prove di laboratorio.",
      ctaTitle: "Serve un piano qualità per la vostra specifica?", ctaBody: "Comunicate struttura, volume e mercato per definire i controlli prima di campioni e produzione.",
      seoTitle: "Produzione, ispezione e laboratorio", seoDescription: "Scopri le capacità TOOYEI nella produzione, ispezione pre-spedizione e test dei pavimenti.",
    },
    pages: {
      manufacturing: {
        eyebrow: "Coordinamento produttivo", title: "Produzione organizzata intorno al prodotto.", summary: "Una vista reale di linee e finiture, dalla formazione del pannello alla consegna imballata.",
        introTitle: "Si parte dal programma prodotto approvato.", introBody: "La produzione è coordinata per struttura, decoro, superficie, incastro, supporto, imballo e mercato. Gli impianti mostrati fanno parte della rete produttiva usata per i relativi progetti.",
        processTitle: "Flusso produttivo tipico", steps: [
          { title: "Formazione di nucleo e pannello", description: "Formulazione, formatura e condizioni del pannello seguono la struttura approvata." },
          { title: "Decoro e finitura", description: "Film decorativo, strato d’usura e trattamento vengono allineati al campione approvato." },
          { title: "Profilatura e movimentazione", description: "Taglio, profilatura click e movimentazione controllata preparano i pannelli al controllo finale." },
          { title: "Imballo e rilascio", description: "Il prodotto viene imballato secondo il progetto prima dell’ispezione di spedizione." },
        ], note: "Il flusso varia per SPC, WPC, LVT, laminato e strutture personalizzate.",
        seoTitle: "Produzione e coordinamento pavimenti", seoDescription: "Linee, finitura, profilatura e imballaggio di pavimenti coordinati da TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "Ispezione pre-spedizione", title: "Controlli qualità resi visibili.", summary: "Dal confronto con il campione a dimensioni, superficie, imballo ed etichette.",
        introTitle: "I criteri partono dalla specifica approvata.", introBody: "Campione, specifica, istruzioni di imballo e stato della produzione vengono verificati punto per punto, registrando le eccezioni.",
        processTitle: "Punti di controllo tipici", steps: [
          { title: "Confronto con il campione", description: "Verificare decoro, texture, bisello e aspetto rispetto al campione approvato." },
          { title: "Dimensioni e spessore", description: "Controllare lunghezza, larghezza, spessore totale e dimensioni critiche." },
          { title: "Giunti e superficie", description: "Esaminare accoppiamento, incastro, biselli e aspetto superficiale." },
          { title: "Strato d’usura e brillantezza", description: "Controllare strato d’usura e brillantezza quando specificati." },
          { title: "Imballo e marcatura", description: "Confermare scatole, stampa, etichette, protezione e pallet." },
        ], note: "I valori visibili riguardano solo il campione controllato e non sostituiscono specifiche o rapporti.",
        seoTitle: "Ispezione pre-spedizione pavimenti", seoDescription: "Controllo di campione, dimensioni, spessore, superficie, etichette e imballo.",
      },
      "laboratory-testing": {
        eyebrow: "Prove di laboratorio", title: "Test a supporto delle decisioni di prodotto.", summary: "Ambienti e attrezzature per valutare campioni, meccanica, superfici e materiali.",
        introTitle: "Il piano prove segue prodotto e mercato.", introBody: "Il laboratorio supporta campioni, verifica della produzione e documenti. Metodi e criteri sono confermati per ogni programma.",
        processTitle: "Principali aree di prova", steps: [
          { title: "Condizionamento e stabilità", description: "Osservare variazioni dimensionali e fisiche in condizioni definite." },
          { title: "Prestazioni meccaniche e incastro", description: "Valutare carico, connessione e comportamento strutturale dei campioni." },
          { title: "Superficie e usura", description: "Eseguire controlli di superficie, attrito e usura secondo il prodotto." },
          { title: "Materiali e chimica", description: "Organizzare test sui materiali o chimici secondo progetto e mercato." },
        ], note: "Le immagini non attestano da sole accreditamento o conformità; credenziali e rapporti sono confermati separatamente.",
        seoTitle: "Laboratorio e prove pavimenti", seoDescription: "Prove ambientali, meccaniche, superficiali, di usura e materiali.",
      },
    },
  },
  ar: {
    home: "الرئيسية", capabilities: "التصنيع والجودة", viewDetails: "عرض التفاصيل", gallery: "صور من الموقع",
    galleryBody: "جميع الصور من مواد الإنتاج والفحص والمختبر المقدمة، ولا يتم استخدام أي فيديو.", contact: "ناقش مشروعاً",
    hub: {
      eyebrow: "التصنيع والجودة", title: "عملية واضحة خلف كل برنامج أرضيات.",
      summary: "توضح صور حقيقية للإنتاج والفحص قبل الشحن والمختبر كيف تنسق TOOYEI التصنيع والجودة وفق مواصفات المنتج.",
      sectionTitle: "من خط الإنتاج إلى التحقق النهائي.", sectionBody: "ثلاث صفحات تشرح تنسيق التصنيع والفحص قبل الشحن واختبارات المختبر.",
      ctaTitle: "هل تحتاج إلى خطة جودة لمواصفاتك؟", ctaBody: "شارك البنية والكمية والسوق المستهدف لتحديد أولويات الفحص قبل العينات والإنتاج.",
      seoTitle: "التصنيع والفحص والمختبر", seoDescription: "تعرف على قدرات TOOYEI في تصنيع الأرضيات والفحص قبل الشحن والاختبارات.",
    },
    pages: {
      manufacturing: {
        eyebrow: "تنسيق التصنيع", title: "إنتاج منظم حول مواصفات المنتج.", summary: "نظرة حقيقية على الخطوط ومراحل التشطيب من تشكيل الألواح إلى التسليم المعبأ.",
        introTitle: "البداية من برنامج المنتج المعتمد.", introBody: "يتم تنسيق الإنتاج حسب البنية والزخرفة والسطح والقفل والطبقة الخلفية والتغليف والسوق. المنشآت المعروضة جزء من شبكة الإنتاج المستخدمة للمشاريع ذات الصلة.",
        processTitle: "مسار إنتاج نموذجي", steps: [
          { title: "تشكيل القلب واللوح", description: "تتم مراقبة الخلطة والتشكيل وحالة اللوح وفق البنية المعتمدة." },
          { title: "الزخرفة وتشطيب السطح", description: "تتم مطابقة طبقة الزخرفة والتآكل والمعالجة مع العينة المعتمدة." },
          { title: "التشكيل والمناولة", description: "يجهز القطع وتشكيل القفل والمناولة المنظمة الألواح للفحص النهائي." },
          { title: "التغليف والإفراج", description: "تعبأ المنتجات حسب متطلبات المشروع قبل فحص ما قبل الشحن." },
        ], note: "يختلف المسار بين SPC وWPC وLVT واللامينيت والبنى المخصصة.",
        seoTitle: "تصنيع وتنسيق إنتاج الأرضيات", seoDescription: "خطوط إنتاج وتشطيب وتشكيل وتغليف الأرضيات لدى TOOYEI.",
      },
      "quality-inspection": {
        eyebrow: "الفحص قبل الشحن", title: "فحوص جودة واضحة.", summary: "من مقارنة العينة المعتمدة إلى الأبعاد والسطح والتغليف والملصقات.",
        introTitle: "تبدأ المعايير من المواصفة المعتمدة.", introBody: "تتم مراجعة العينة والمواصفة وتعليمات التغليف وحالة الإنتاج بنداً بنداً مع تسجيل الاستثناءات.",
        processTitle: "نقاط فحص نموذجية", steps: [
          { title: "مقارنة العينة", description: "مراجعة اللون والملمس والحواف والمظهر مقابل العينة المعتمدة." },
          { title: "الأبعاد والسماكة", description: "فحص الطول والعرض والسماكة الكلية والأبعاد المهمة بالعينة." },
          { title: "الوصلات والسطح", description: "مراجعة ملاءمة الوصلات والقفل والحواف ومظهر السطح." },
          { title: "طبقة التآكل واللمعان", description: "فحص طبقة التآكل ولمعان السطح عند تحديدهما." },
          { title: "التغليف والعلامات", description: "تأكيد الصناديق والطباعة والملصقات والحماية وحالة المنصات." },
        ], note: "القيم الظاهرة تخص العينة المفحوصة فقط ولا تحل محل المواصفة أو تقرير الفحص.",
        seoTitle: "فحص الأرضيات قبل الشحن", seoDescription: "فحص العينات والأبعاد والسماكة والسطح والملصقات والتغليف.",
      },
      "laboratory-testing": {
        eyebrow: "اختبارات المختبر", title: "اختبارات تدعم قرارات المنتج.", summary: "بيئات ومعدات لتقييم عينات الأرضيات والأداء الميكانيكي والأسطح والمواد.",
        introTitle: "نطاق الاختبار يتبع المنتج والسوق.", introBody: "يدعم المختبر اعتماد العينات والتحقق من الإنتاج ووثائق المشروع. يتم تأكيد الطرق والمعايير لكل برنامج.",
        processTitle: "مجالات الاختبار الرئيسية", steps: [
          { title: "التكييف والثبات", description: "مراقبة التغيرات البعدية والفيزيائية في ظروف بيئية محددة." },
          { title: "الأداء الميكانيكي والقفل", description: "تقييم الحمل والاتصال والسلوك البنيوي للعينات المحضرة." },
          { title: "السطح والتآكل", description: "إجراء فحوص السطح والاحتكاك والتآكل حسب مواصفات المنتج." },
          { title: "المواد والكيمياء", description: "ترتيب اختبارات المواد أو الاختبارات الكيميائية حسب المشروع والسوق." },
        ], note: "لا تثبت الصور وحدها اعتماد المختبر أو المطابقة لمعيار محدد؛ يتم تأكيد الشهادات والتقارير بشكل منفصل.",
        seoTitle: "مختبر واختبارات الأرضيات", seoDescription: "اختبارات الثبات والميكانيكا والسطح والتآكل والمواد للأرضيات.",
      },
    },
  },
};

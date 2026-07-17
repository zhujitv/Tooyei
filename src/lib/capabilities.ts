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
      eyebrow: "制造控制 · 质量证据",
      title: "把制造能力，变成采购团队可以验证的交付确定性。",
      summary: "从规格冻结、规模化生产到出货检验与测试文件，TOOYEI 用同一套控制逻辑贯穿每一批地板订单。",
      sectionTitle: "三层能力，共同回答一个问题：这批货如何被稳定交付？",
      sectionBody: "生产负责把规格做出来，验货负责发现偏差，实验室与文件负责为产品判断和出货放行提供依据。",
      ctaTitle: "下一批订单，从一份可执行的质量计划开始。",
      ctaBody: "告诉我们产品结构、数量、应用和目标市场，我们会把样品、量产、检验与文件要求整理成清晰的项目路径。",
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
      eyebrow: "Manufacturing control · quality evidence",
      title: "Turning manufacturing capability into delivery confidence you can verify.",
      summary: "From specification freeze and scaled production to shipment inspection and test documentation, one control logic follows every flooring order.",
      sectionTitle: "Three capability layers. One question: how will this order be delivered consistently?",
      sectionBody: "Manufacturing builds the specification, inspection finds deviation, and testing with documentation supports the release decision.",
      ctaTitle: "The next order starts with an actionable quality plan.",
      ctaBody: "Share the construction, volume, application and target market. We will turn sampling, production, inspection and documentation into one clear project path.",
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
      eyebrow: "Fertigungskontrolle · Qualitätsnachweis", title: "Fertigungskompetenz wird zu überprüfbarer Liefersicherheit.",
      summary: "Von der Spezifikationsfreigabe und Serienfertigung bis zur Versandprüfung und Testdokumentation folgt jeder Auftrag derselben Kontrolllogik.",
      sectionTitle: "Drei Kompetenzebenen. Eine Frage: Wie wird dieser Auftrag konstant geliefert?", sectionBody: "Die Fertigung setzt die Spezifikation um, die Inspektion erkennt Abweichungen und Tests sowie Dokumentation stützen die Freigabe.",
      ctaTitle: "Der nächste Auftrag beginnt mit einem umsetzbaren Qualitätsplan.", ctaBody: "Teilen Sie Aufbau, Menge, Anwendung und Zielmarkt. Wir verbinden Muster, Produktion, Prüfung und Dokumentation zu einem klaren Projektweg.",
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
      eyebrow: "Maîtrise industrielle · preuves qualité", title: "Transformer la capacité industrielle en fiabilité de livraison vérifiable.",
      summary: "Du gel des spécifications et de la production en série au contrôle avant expédition et aux documents d’essai, une même logique suit chaque commande.",
      sectionTitle: "Trois niveaux de capacité. Une question : comment garantir une livraison constante ?", sectionBody: "La fabrication réalise la spécification, l’inspection détecte les écarts, et les essais avec la documentation appuient la décision de libération.",
      ctaTitle: "La prochaine commande commence par un plan qualité opérationnel.", ctaBody: "Partagez structure, volume, application et marché cible. Nous relions échantillons, production, inspection et documents dans un parcours clair.",
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
      eyebrow: "Control de fabricación · evidencia de calidad", title: "Convertimos capacidad productiva en confianza de entrega verificable.",
      summary: "Desde el cierre de especificaciones y la producción en serie hasta la inspección y la documentación de ensayo, una misma lógica controla cada pedido.",
      sectionTitle: "Tres capas de capacidad. Una pregunta: ¿cómo se entregará este pedido con consistencia?", sectionBody: "La fabricación ejecuta la especificación, la inspección detecta desviaciones y los ensayos con documentación respaldan la liberación.",
      ctaTitle: "El próximo pedido empieza con un plan de calidad ejecutable.", ctaBody: "Comparta estructura, volumen, aplicación y mercado. Integramos muestras, producción, inspección y documentación en una ruta clara.",
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
      eyebrow: "Контроль производства · доказательства качества", title: "Превращаем производственные возможности в проверяемую уверенность в поставке.",
      summary: "От фиксации спецификации и серийного выпуска до инспекции и протоколов испытаний — каждый заказ проходит единую систему контроля.",
      sectionTitle: "Три уровня возможностей. Один вопрос: как обеспечить стабильную поставку?", sectionBody: "Производство реализует спецификацию, инспекция выявляет отклонения, а испытания и документы поддерживают решение об отгрузке.",
      ctaTitle: "Следующий заказ начинается с рабочего плана качества.", ctaBody: "Сообщите конструкцию, объём, применение и рынок. Мы объединим образцы, производство, инспекцию и документы в понятный маршрут.",
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
      eyebrow: "製造管理 · 品質エビデンス", title: "製造力を、検証できる納品の確実性へ。",
      summary: "仕様確定と量産から出荷前検品、試験資料まで、すべての床材オーダーを一貫した管理ロジックでつなぎます。",
      sectionTitle: "3つの能力層。答えるべき問いは一つ——この注文をどう安定して届けるか。", sectionBody: "製造が仕様を形にし、検品が偏差を見つけ、試験と文書が出荷判断を支えます。",
      ctaTitle: "次の注文は、実行可能な品質計画から始まります。", ctaBody: "構造、数量、用途、対象市場を共有ください。サンプル、量産、検品、文書を一つの明確なプロジェクト経路に整理します。",
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
      eyebrow: "Controllo produttivo · evidenza qualità", title: "Trasformiamo la capacità produttiva in affidabilità di consegna verificabile.",
      summary: "Dal blocco delle specifiche e dalla produzione in serie all’ispezione e ai documenti di prova, ogni ordine segue un’unica logica di controllo.",
      sectionTitle: "Tre livelli di capacità. Una domanda: come consegnare questo ordine con continuità?", sectionBody: "La produzione realizza la specifica, l’ispezione rileva gli scostamenti e test con documenti supportano il rilascio.",
      ctaTitle: "Il prossimo ordine inizia con un piano qualità operativo.", ctaBody: "Condividete struttura, volume, applicazione e mercato. Uniamo campioni, produzione, ispezione e documenti in un percorso chiaro.",
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
      eyebrow: "ضبط التصنيع · أدلة الجودة", title: "نحوّل القدرة التصنيعية إلى ثقة قابلة للتحقق في التسليم.",
      summary: "من تثبيت المواصفات والإنتاج الكمي إلى فحص ما قبل الشحن ووثائق الاختبار، يتبع كل طلب نظام ضبط واحداً.",
      sectionTitle: "ثلاث طبقات من القدرة وسؤال واحد: كيف نضمن تسليم هذا الطلب بثبات؟", sectionBody: "يحوّل التصنيع المواصفة إلى منتج، ويكشف الفحص الانحرافات، وتدعم الاختبارات والوثائق قرار الإفراج.",
      ctaTitle: "يبدأ الطلب التالي بخطة جودة قابلة للتنفيذ.", ctaBody: "شارك البنية والكمية والاستخدام والسوق. نحول العينات والإنتاج والفحص والوثائق إلى مسار مشروع واضح.",
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

type CapabilityNarrativeItem = {
  title: string;
  description: string;
};

type CapabilityMetricCopy = {
  label: string;
  detail: string;
};

export type CapabilityNarrativeCopy = {
  proof: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    metrics: CapabilityMetricCopy[];
  };
  risk: {
    eyebrow: string;
    title: string;
    body: string;
    commitments: CapabilityNarrativeItem[];
  };
  system: {
    eyebrow: string;
    title: string;
    body: string;
    stages: CapabilityNarrativeItem[];
  };
  deliverables: {
    eyebrow: string;
    title: string;
    body: string;
    items: CapabilityNarrativeItem[];
  };
};

export const capabilityMetricValues = ["50,000 m²", "10+", "1.44M m²", "8"] as const;

export const capabilitiesNarrativeCopy: Record<Locale, CapabilityNarrativeCopy> = {
  zh: {
    proof: {
      eyebrow: "公开能力基线",
      title: "规模不是口号，它必须能支撑稳定生产。",
      body: "TOOYEI 原站公开的制造信息，构成这套能力叙事的事实起点。更重要的是，我们把规模落实到具体产品、生产环节和每一批订单的检查要求中。",
      note: "规模数据来自 TOOYEI 当前公开的公司资料；具体产品范围、产线安排、产能与测试要求以订单确认文件为准。",
      metrics: [
        { label: "生产基础", detail: "公开的现代化生产基地面积" },
        { label: "地板产线", detail: "覆盖 SPC、WPC、LVT 与强化地板" },
        { label: "公开年产能", detail: "支持批量与持续补货项目" },
        { label: "受控环节", detail: "从原料准备到包装装运" },
      ],
    },
    risk: {
      eyebrow: "采购风险，被拆成可管理的节点",
      title: "我们不把质量留到最后一次验货。",
      body: "可靠交付不是靠出货前补救，而是从产品定义开始，把容易产生偏差的结构、花色、表面、锁扣、底垫、包装和文件逐项锁定。",
      commitments: [
        { title: "先冻结规格", description: "在打样和量产前统一产品结构、视觉标准、包装与目标市场要求。" },
        { title: "在过程里找偏差", description: "把尺寸、表面、拼接、包装和标识检查放进生产与出货节点。" },
        { title: "用证据支持放行", description: "以现场记录、抽检结果和适用的测试文件支持采购团队作出判断。" },
      ],
    },
    system: {
      eyebrow: "一个订单控制系统",
      title: "从需求到出货，五次关键交接。",
      body: "每一次交接都明确下一阶段需要什么输入、检查什么风险、留下什么记录，减少口头沟通造成的信息损耗。",
      stages: [
        { title: "定义产品", description: "确认市场、应用、结构、花色、性能与合规方向。" },
        { title: "工程转化", description: "把确认方案转化为样品、物料、工艺路线和包装要求。" },
        { title: "过程控制", description: "围绕板材、表面、开槽、底垫和包装监控关键偏差。" },
        { title: "批次验证", description: "通过出货前抽检与适用测试核对产品和订单要求。" },
        { title: "放行交付", description: "确认包装、标签、托盘、文件与装运条件后完成放行。" },
      ],
    },
    deliverables: {
      eyebrow: "买家最终拿到什么",
      title: "不只有货，还有支持内部决策和市场沟通的交付证据。",
      body: "根据产品与项目范围，质量交付可以覆盖以下四类信息。",
      items: [
        { title: "已确认的产品基线", description: "规格、样品、外观和包装要求形成统一的执行依据。" },
        { title: "批次质量记录", description: "关键尺寸、表面、拼接、包装与标识的检查记录。" },
        { title: "测试与合规协调", description: "按目标市场和产品规格协调可用证书、报告或测试安排。" },
        { title: "出货放行信息", description: "包装、托盘、装运和异常处理信息形成可追溯交付记录。" },
      ],
    },
  },
  en: {
    proof: {
      eyebrow: "Published capability baseline",
      title: "Scale is only useful when it supports repeatable production.",
      body: "The manufacturing information published on TOOYEI’s original site is the factual starting point. The real value comes from connecting that scale to product scope, process control and the inspection priorities of each order.",
      note: "Scale figures are taken from TOOYEI’s current published company information. Product scope, line allocation, capacity and test requirements are confirmed in the order documentation.",
      metrics: [
        { label: "Production footprint", detail: "Published modern manufacturing base" },
        { label: "Flooring lines", detail: "SPC, WPC, LVT and laminate coverage" },
        { label: "Published annual capacity", detail: "Built for volume and repeat supply" },
        { label: "Controlled stages", detail: "From raw material to packed shipment" },
      ],
    },
    risk: {
      eyebrow: "Sourcing risk, broken into controllable decisions",
      title: "Quality is not left to one final inspection.",
      body: "Reliable delivery starts with product definition. Construction, decor, surface, locking, backing, packing and documentation are aligned before they become expensive production deviations.",
      commitments: [
        { title: "Freeze the specification first", description: "Align construction, visual standard, packaging and target-market requirements before sampling and production." },
        { title: "Find deviation in the process", description: "Place dimension, surface, joint, packing and marking checks inside production and shipment gates." },
        { title: "Release with evidence", description: "Use on-site records, inspection results and applicable test documents to support the buyer’s decision." },
      ],
    },
    system: {
      eyebrow: "One order-control system",
      title: "Five critical handovers from brief to shipment.",
      body: "Each handover defines the input, the risk to check and the evidence to retain—reducing information loss between sales, production, quality and logistics.",
      stages: [
        { title: "Define the product", description: "Confirm market, application, construction, decor, performance and compliance direction." },
        { title: "Engineer the programme", description: "Translate the approved direction into samples, materials, process routing and packaging." },
        { title: "Control the process", description: "Monitor critical deviation across board, surface, profiling, backing and packing stages." },
        { title: "Verify the batch", description: "Use pre-shipment inspection and applicable tests to check product and order requirements." },
        { title: "Release and deliver", description: "Confirm packing, labels, pallets, documents and shipping conditions before release." },
      ],
    },
    deliverables: {
      eyebrow: "What the buyer receives",
      title: "Not only goods, but evidence for internal decisions and market communication.",
      body: "Depending on the product and project scope, quality delivery can cover four practical information sets.",
      items: [
        { title: "Approved product baseline", description: "Specification, sample, appearance and packing requirements form one execution reference." },
        { title: "Batch quality records", description: "Records for critical dimensions, surfaces, joints, packing and identification." },
        { title: "Test and compliance coordination", description: "Available certificates, reports or testing are aligned to product and destination market." },
        { title: "Shipment release information", description: "Packing, pallet, loading and exception details create a traceable delivery record." },
      ],
    },
  },
  de: {
    proof: {
      eyebrow: "Veröffentlichte Leistungsbasis",
      title: "Größe zählt nur, wenn sie wiederholbare Produktion ermöglicht.",
      body: "Die auf der ursprünglichen TOOYEI-Website veröffentlichten Fertigungsdaten bilden den sachlichen Ausgangspunkt. Entscheidend ist die Verbindung von Größe, Produktspektrum, Prozesskontrolle und Auftragsprüfung.",
      note: "Die Kennzahlen stammen aus den aktuell veröffentlichten Unternehmensangaben. Produktspektrum, Linienbelegung, Kapazität und Prüfanforderungen werden je Auftrag bestätigt.",
      metrics: [
        { label: "Produktionsfläche", detail: "Veröffentlichte moderne Fertigungsbasis" },
        { label: "Bodenlinien", detail: "SPC, WPC, LVT und Laminat" },
        { label: "Veröffentlichte Jahreskapazität", detail: "Für Volumen und Nachlieferungen" },
        { label: "Kontrollstufen", detail: "Vom Rohstoff bis zum Versand" },
      ],
    },
    risk: {
      eyebrow: "Beschaffungsrisiken in steuerbare Entscheidungen zerlegt",
      title: "Qualität wird nicht der letzten Prüfung überlassen.",
      body: "Zuverlässige Lieferung beginnt mit der Produktdefinition. Aufbau, Dekor, Oberfläche, Klicksystem, Unterlage, Verpackung und Dokumentation werden vor der Serienfertigung abgestimmt.",
      commitments: [
        { title: "Spezifikation zuerst fixieren", description: "Aufbau, Optik, Verpackung und Zielmarkt vor Musterung und Produktion abstimmen." },
        { title: "Abweichungen im Prozess finden", description: "Maß-, Oberflächen-, Fugen-, Verpackungs- und Kennzeichnungsprüfungen in den Ablauf integrieren." },
        { title: "Mit Nachweisen freigeben", description: "Vor-Ort-Aufzeichnungen, Prüfergebnisse und relevante Testdokumente stützen die Entscheidung." },
      ],
    },
    system: {
      eyebrow: "Ein System zur Auftragskontrolle",
      title: "Fünf entscheidende Übergaben vom Briefing bis zum Versand.",
      body: "Jede Übergabe definiert Eingaben, Risiken und Nachweise und reduziert Informationsverluste zwischen Vertrieb, Produktion, Qualität und Logistik.",
      stages: [
        { title: "Produkt definieren", description: "Markt, Anwendung, Aufbau, Dekor, Leistung und Compliance-Richtung bestätigen." },
        { title: "Programm ausarbeiten", description: "Freigaben in Muster, Material, Prozessroute und Verpackung übersetzen." },
        { title: "Prozess kontrollieren", description: "Abweichungen bei Platte, Oberfläche, Profil, Unterlage und Verpackung überwachen." },
        { title: "Charge verifizieren", description: "Produkt und Auftrag durch Vorversandprüfung und passende Tests abgleichen." },
        { title: "Freigeben und liefern", description: "Verpackung, Etiketten, Paletten, Dokumente und Versandbedingungen bestätigen." },
      ],
    },
    deliverables: {
      eyebrow: "Was der Käufer erhält",
      title: "Nicht nur Ware, sondern Nachweise für interne Entscheidungen und Marktkommunikation.",
      body: "Je nach Produkt und Projekt kann die Qualitätslieferung vier Informationsbereiche abdecken.",
      items: [
        { title: "Freigegebene Produktbasis", description: "Spezifikation, Muster, Optik und Verpackung bilden eine gemeinsame Referenz." },
        { title: "Qualitätsaufzeichnungen der Charge", description: "Dokumentation zu Maßen, Oberflächen, Fugen, Verpackung und Kennzeichnung." },
        { title: "Test- und Compliance-Koordination", description: "Verfügbare Zertifikate, Berichte oder Tests werden auf Produkt und Markt abgestimmt." },
        { title: "Versandfreigabe", description: "Verpackungs-, Paletten-, Lade- und Abweichungsdaten schaffen Rückverfolgbarkeit." },
      ],
    },
  },
  fr: {
    proof: {
      eyebrow: "Référentiel de capacité publié",
      title: "L’échelle n’a de valeur que si elle permet une production reproductible.",
      body: "Les données industrielles publiées sur le site historique de TOOYEI constituent le point de départ factuel. Leur valeur vient du lien entre capacité, produits, maîtrise des procédés et contrôles de chaque commande.",
      note: "Les chiffres proviennent des informations d’entreprise actuellement publiées. Produits, affectation des lignes, capacité et essais sont confirmés dans les documents de commande.",
      metrics: [
        { label: "Empreinte industrielle", detail: "Base de production moderne publiée" },
        { label: "Lignes de sols", detail: "SPC, WPC, LVT et stratifié" },
        { label: "Capacité annuelle publiée", detail: "Volume et réassort régulier" },
        { label: "Étapes maîtrisées", detail: "De la matière à l’expédition" },
      ],
    },
    risk: {
      eyebrow: "Le risque achat transformé en décisions maîtrisables",
      title: "La qualité ne dépend pas d’un seul contrôle final.",
      body: "La fiabilité commence avec la définition du produit. Structure, décor, surface, clic, sous-couche, emballage et documents sont alignés avant la production en série.",
      commitments: [
        { title: "Figer d’abord la spécification", description: "Aligner structure, standard visuel, emballage et marché avant les échantillons et la production." },
        { title: "Détecter les écarts en cours de route", description: "Intégrer les contrôles dimensionnels, surface, assemblage, emballage et marquage aux jalons." },
        { title: "Libérer avec des preuves", description: "S’appuyer sur les relevés terrain, résultats d’inspection et documents d’essai applicables." },
      ],
    },
    system: {
      eyebrow: "Un seul système de maîtrise de commande",
      title: "Cinq passages clés du brief à l’expédition.",
      body: "Chaque passage définit les données d’entrée, les risques et les preuves à conserver, en limitant les pertes d’information entre vente, production, qualité et logistique.",
      stages: [
        { title: "Définir le produit", description: "Confirmer marché, usage, structure, décor, performance et orientation conformité." },
        { title: "Industrialiser le programme", description: "Transformer l’accord en échantillons, matières, gamme de fabrication et emballage." },
        { title: "Maîtriser le procédé", description: "Surveiller les écarts sur panneau, surface, profilage, sous-couche et emballage." },
        { title: "Vérifier le lot", description: "Contrôler produit et commande par inspection avant expédition et essais adaptés." },
        { title: "Libérer et livrer", description: "Confirmer emballage, étiquettes, palettes, documents et conditions d’envoi." },
      ],
    },
    deliverables: {
      eyebrow: "Ce que reçoit l’acheteur",
      title: "Pas seulement des marchandises, mais des preuves pour décider et communiquer.",
      body: "Selon le produit et le projet, la livraison qualité peut couvrir quatre ensembles d’informations.",
      items: [
        { title: "Référentiel produit approuvé", description: "Spécification, échantillon, aspect et emballage forment une base unique." },
        { title: "Relevés qualité du lot", description: "Données sur dimensions, surfaces, assemblages, emballage et identification." },
        { title: "Coordination essais et conformité", description: "Certificats, rapports ou essais disponibles sont alignés sur produit et marché." },
        { title: "Informations de libération", description: "Emballage, palettes, chargement et écarts créent une livraison traçable." },
      ],
    },
  },
  es: {
    proof: {
      eyebrow: "Base de capacidad publicada",
      title: "La escala solo importa cuando permite una producción repetible.",
      body: "Los datos de fabricación publicados en el sitio original de TOOYEI son el punto de partida. Su valor real está en conectar escala, gama de producto, control de proceso y prioridades de cada pedido.",
      note: "Las cifras proceden de la información corporativa publicada. Producto, asignación de líneas, capacidad y ensayos se confirman en la documentación del pedido.",
      metrics: [
        { label: "Base productiva", detail: "Instalación moderna publicada" },
        { label: "Líneas de suelo", detail: "SPC, WPC, LVT y laminado" },
        { label: "Capacidad anual publicada", detail: "Volumen y suministro recurrente" },
        { label: "Etapas controladas", detail: "De materia prima a expedición" },
      ],
    },
    risk: {
      eyebrow: "El riesgo de compra dividido en decisiones controlables",
      title: "La calidad no se deja para una única inspección final.",
      body: "La entrega fiable empieza al definir el producto. Estructura, diseño, superficie, clic, base, embalaje y documentos se alinean antes de convertirse en desviaciones costosas.",
      commitments: [
        { title: "Cerrar primero la especificación", description: "Alinear estructura, estándar visual, embalaje y mercado antes de muestras y producción." },
        { title: "Detectar desviaciones en proceso", description: "Integrar controles de dimensiones, superficie, unión, embalaje y marcado en los hitos." },
        { title: "Liberar con evidencia", description: "Apoyar la decisión con registros, resultados de inspección y documentos de ensayo aplicables." },
      ],
    },
    system: {
      eyebrow: "Un sistema de control del pedido",
      title: "Cinco traspasos críticos desde el briefing hasta el envío.",
      body: "Cada traspaso define entradas, riesgos y evidencias, reduciendo pérdidas de información entre ventas, producción, calidad y logística.",
      stages: [
        { title: "Definir el producto", description: "Confirmar mercado, uso, estructura, diseño, rendimiento y dirección normativa." },
        { title: "Convertirlo en programa", description: "Traducir la aprobación en muestras, materiales, ruta de proceso y embalaje." },
        { title: "Controlar el proceso", description: "Vigilar desviaciones en panel, superficie, perfilado, base y embalaje." },
        { title: "Verificar el lote", description: "Comprobar producto y pedido mediante inspección y ensayos aplicables." },
        { title: "Liberar y entregar", description: "Confirmar embalaje, etiquetas, palés, documentos y condiciones de envío." },
      ],
    },
    deliverables: {
      eyebrow: "Lo que recibe el comprador",
      title: "No solo mercancía, también evidencia para decidir y comunicar al mercado.",
      body: "Según el producto y el proyecto, la entrega de calidad puede cubrir cuatro grupos de información.",
      items: [
        { title: "Base de producto aprobada", description: "Especificación, muestra, apariencia y embalaje forman una referencia única." },
        { title: "Registros de calidad del lote", description: "Datos de dimensiones, superficies, uniones, embalaje e identificación." },
        { title: "Coordinación de ensayos y cumplimiento", description: "Certificados, informes o ensayos se alinean con producto y mercado." },
        { title: "Información de liberación", description: "Embalaje, palés, carga e incidencias forman un registro trazable." },
      ],
    },
  },
  ru: {
    proof: {
      eyebrow: "Опубликованная база возможностей",
      title: "Масштаб важен только тогда, когда обеспечивает повторяемое производство.",
      body: "Производственные данные с исходного сайта TOOYEI — фактическая отправная точка. Их ценность раскрывается через связь масштаба, ассортимента, контроля процесса и требований каждого заказа.",
      note: "Цифры взяты из опубликованных данных компании. Продукт, загрузка линий, мощность и испытания подтверждаются документами заказа.",
      metrics: [
        { label: "Производственная база", detail: "Опубликованная площадь площадки" },
        { label: "Линии покрытий", detail: "SPC, WPC, LVT и ламинат" },
        { label: "Опубликованная мощность", detail: "Объём и повторные поставки" },
        { label: "Этапы контроля", detail: "От сырья до отгрузки" },
      ],
    },
    risk: {
      eyebrow: "Риски закупки разделены на управляемые решения",
      title: "Качество не откладывается до последней инспекции.",
      body: "Надёжность начинается с определения продукта. Конструкция, декор, поверхность, замок, подложка, упаковка и документы согласуются до серийного производства.",
      commitments: [
        { title: "Сначала зафиксировать спецификацию", description: "Согласовать конструкцию, внешний вид, упаковку и требования рынка до образцов." },
        { title: "Находить отклонения в процессе", description: "Встроить проверки размеров, поверхности, соединений, упаковки и маркировки в этапы производства." },
        { title: "Разрешать отгрузку по доказательствам", description: "Использовать записи, результаты инспекции и применимые протоколы испытаний." },
      ],
    },
    system: {
      eyebrow: "Единая система контроля заказа",
      title: "Пять ключевых передач от задания до отгрузки.",
      body: "Каждая передача определяет входные данные, риски и сохраняемые доказательства, снижая потери информации между продажами, производством, качеством и логистикой.",
      stages: [
        { title: "Определить продукт", description: "Подтвердить рынок, применение, конструкцию, декор, показатели и соответствие." },
        { title: "Спроектировать программу", description: "Перевести согласование в образцы, материалы, маршрут и упаковку." },
        { title: "Контролировать процесс", description: "Следить за плитой, поверхностью, профилем, подложкой и упаковкой." },
        { title: "Проверить партию", description: "Сверить продукт и заказ инспекцией перед отгрузкой и нужными тестами." },
        { title: "Разрешить и доставить", description: "Подтвердить упаковку, этикетки, палеты, документы и условия отправки." },
      ],
    },
    deliverables: {
      eyebrow: "Что получает покупатель",
      title: "Не только товар, но и доказательства для решений и работы с рынком.",
      body: "В зависимости от продукта и проекта пакет качества может включать четыре блока информации.",
      items: [
        { title: "Утверждённая база продукта", description: "Спецификация, образец, внешний вид и упаковка образуют единую основу." },
        { title: "Записи качества партии", description: "Данные по размерам, поверхностям, соединениям, упаковке и маркировке." },
        { title: "Координация испытаний", description: "Сертификаты, отчёты или тесты сопоставляются с продуктом и рынком." },
        { title: "Информация о разрешении отгрузки", description: "Упаковка, палеты, погрузка и отклонения создают прослеживаемую запись." },
      ],
    },
  },
  ja: {
    proof: {
      eyebrow: "公開された能力基準",
      title: "規模は、再現性のある生産を支えて初めて意味を持ちます。",
      body: "旧TOOYEIサイトで公開された製造情報を事実の起点とし、その規模を製品範囲、工程管理、各注文の検査重点へ結び付けます。",
      note: "数値は現在公開中の会社情報に基づきます。製品範囲、ライン配分、能力、試験要件は注文書類で個別に確認します。",
      metrics: [
        { label: "生産基盤", detail: "公開されている近代的な製造拠点" },
        { label: "床材ライン", detail: "SPC・WPC・LVT・ラミネート" },
        { label: "公開年間能力", detail: "量産と継続供給に対応" },
        { label: "管理工程", detail: "原料から梱包・出荷まで" },
      ],
    },
    risk: {
      eyebrow: "調達リスクを管理可能な判断へ分解",
      title: "品質を最後の検品一回に委ねません。",
      body: "安定した納品は製品定義から始まります。構造、柄、表面、クリック、裏材、梱包、文書を量産前にそろえます。",
      commitments: [
        { title: "まず仕様を固定", description: "サンプルと量産前に構造、外観基準、梱包、市場要件を統一します。" },
        { title: "工程内で偏差を発見", description: "寸法、表面、接合、梱包、表示の確認を生産と出荷の節目に組み込みます。" },
        { title: "証拠に基づき出荷判断", description: "現場記録、検品結果、適用可能な試験文書で購買判断を支えます。" },
      ],
    },
    system: {
      eyebrow: "一つの注文管理システム",
      title: "要件から出荷まで、5つの重要な引き継ぎ。",
      body: "各引き継ぎで入力、確認リスク、保存する証拠を定め、営業・生産・品質・物流間の情報ロスを減らします。",
      stages: [
        { title: "製品を定義", description: "市場、用途、構造、柄、性能、適合方針を確認します。" },
        { title: "製造計画へ変換", description: "承認内容をサンプル、材料、工程ルート、梱包へ落とし込みます。" },
        { title: "工程を管理", description: "板材、表面、加工、裏材、梱包の重要な偏差を監視します。" },
        { title: "ロットを検証", description: "出荷前検品と必要な試験で製品と注文要件を照合します。" },
        { title: "出荷を承認", description: "梱包、ラベル、パレット、文書、輸送条件を確認します。" },
      ],
    },
    deliverables: {
      eyebrow: "バイヤーが受け取るもの",
      title: "商品だけでなく、社内判断と市場説明を支える証拠も届けます。",
      body: "製品と案件範囲に応じて、品質納品は次の4つの情報を含みます。",
      items: [
        { title: "承認済み製品基準", description: "仕様、サンプル、外観、梱包を一つの実行基準にします。" },
        { title: "ロット品質記録", description: "主要寸法、表面、接合、梱包、表示に関する記録です。" },
        { title: "試験・適合の調整", description: "利用可能な証明書、報告書、試験を製品と市場に合わせます。" },
        { title: "出荷承認情報", description: "梱包、パレット、積載、例外情報で追跡可能な記録を作ります。" },
      ],
    },
  },
  it: {
    proof: {
      eyebrow: "Base di capacità pubblicata",
      title: "La scala conta solo quando sostiene una produzione ripetibile.",
      body: "I dati produttivi pubblicati sul sito storico TOOYEI sono il punto di partenza. Il valore nasce collegando scala, gamma, controllo del processo e priorità di ogni ordine.",
      note: "I dati derivano dalle informazioni aziendali pubblicate. Gamma, assegnazione linee, capacità e test sono confermati nei documenti d’ordine.",
      metrics: [
        { label: "Base produttiva", detail: "Sito produttivo moderno pubblicato" },
        { label: "Linee pavimenti", detail: "SPC, WPC, LVT e laminato" },
        { label: "Capacità annua pubblicata", detail: "Volumi e forniture ricorrenti" },
        { label: "Fasi controllate", detail: "Dalla materia alla spedizione" },
      ],
    },
    risk: {
      eyebrow: "Rischio di acquisto diviso in decisioni controllabili",
      title: "La qualità non è affidata a un solo controllo finale.",
      body: "La consegna affidabile parte dalla definizione del prodotto. Struttura, decoro, superficie, incastro, supporto, imballo e documenti vengono allineati prima della serie.",
      commitments: [
        { title: "Bloccare prima la specifica", description: "Allineare struttura, standard visivo, imballo e mercato prima di campioni e produzione." },
        { title: "Trovare gli scostamenti nel processo", description: "Integrare controlli di dimensione, superficie, giunti, imballo e marcatura nei passaggi chiave." },
        { title: "Rilasciare con evidenze", description: "Usare registrazioni, risultati di ispezione e documenti di prova applicabili." },
      ],
    },
    system: {
      eyebrow: "Un sistema di controllo ordine",
      title: "Cinque passaggi critici dal brief alla spedizione.",
      body: "Ogni passaggio definisce input, rischi ed evidenze, riducendo perdite di informazione tra vendite, produzione, qualità e logistica.",
      stages: [
        { title: "Definire il prodotto", description: "Confermare mercato, uso, struttura, decoro, prestazioni e conformità." },
        { title: "Progettare il programma", description: "Tradurre l’approvazione in campioni, materiali, percorso e imballo." },
        { title: "Controllare il processo", description: "Monitorare pannello, superficie, profilatura, supporto e imballo." },
        { title: "Verificare il lotto", description: "Confrontare prodotto e ordine con ispezione e test applicabili." },
        { title: "Rilasciare e consegnare", description: "Confermare imballo, etichette, pallet, documenti e condizioni di spedizione." },
      ],
    },
    deliverables: {
      eyebrow: "Cosa riceve l’acquirente",
      title: "Non solo merce, ma evidenze per decisioni interne e comunicazione al mercato.",
      body: "Secondo prodotto e progetto, la consegna qualità può coprire quattro gruppi di informazioni.",
      items: [
        { title: "Base prodotto approvata", description: "Specifica, campione, aspetto e imballo formano un unico riferimento." },
        { title: "Registri qualità del lotto", description: "Dati su dimensioni, superfici, giunti, imballo e identificazione." },
        { title: "Coordinamento test e conformità", description: "Certificati, report o test disponibili sono allineati a prodotto e mercato." },
        { title: "Informazioni di rilascio", description: "Imballo, pallet, carico e anomalie creano una registrazione tracciabile." },
      ],
    },
  },
  ar: {
    proof: {
      eyebrow: "خط أساس معلن للقدرات",
      title: "لا قيمة للحجم ما لم يدعم إنتاجاً قابلاً للتكرار.",
      body: "تمثل بيانات التصنيع المنشورة في موقع TOOYEI الأصلي نقطة البداية الواقعية. وتأتي القيمة من ربط الحجم بنطاق المنتجات وضبط العمليات وأولويات فحص كل طلب.",
      note: "الأرقام مأخوذة من معلومات الشركة المنشورة حالياً. يتم تأكيد نطاق المنتج وتخصيص الخطوط والطاقة ومتطلبات الاختبار في مستندات الطلب.",
      metrics: [
        { label: "قاعدة الإنتاج", detail: "منشأة تصنيع حديثة معلنة" },
        { label: "خطوط الأرضيات", detail: "SPC وWPC وLVT واللامينيت" },
        { label: "الطاقة السنوية المعلنة", detail: "للكميات والتوريد المتكرر" },
        { label: "مراحل مضبوطة", detail: "من المواد الخام إلى الشحن" },
      ],
    },
    risk: {
      eyebrow: "مخاطر التوريد مقسمة إلى قرارات قابلة للضبط",
      title: "لا نترك الجودة لفحص نهائي واحد.",
      body: "يبدأ التسليم الموثوق بتعريف المنتج. تتم مواءمة البنية والزخرفة والسطح والقفل والطبقة الخلفية والتغليف والوثائق قبل الإنتاج الكمي.",
      commitments: [
        { title: "تثبيت المواصفة أولاً", description: "مواءمة البنية والمعيار البصري والتغليف والسوق قبل العينات والإنتاج." },
        { title: "اكتشاف الانحراف أثناء العملية", description: "إدخال فحوص الأبعاد والسطح والوصلات والتغليف والعلامات في مراحل الإنتاج والشحن." },
        { title: "الإفراج بناءً على الأدلة", description: "استخدام سجلات الموقع ونتائج الفحص ووثائق الاختبار المناسبة لدعم القرار." },
      ],
    },
    system: {
      eyebrow: "نظام واحد لضبط الطلب",
      title: "خمس عمليات تسليم رئيسية من المتطلبات إلى الشحن.",
      body: "تحدد كل عملية المدخلات والمخاطر والأدلة المطلوبة، وتقلل فقدان المعلومات بين المبيعات والإنتاج والجودة والخدمات اللوجستية.",
      stages: [
        { title: "تعريف المنتج", description: "تأكيد السوق والاستخدام والبنية والزخرفة والأداء واتجاه المطابقة." },
        { title: "تحويله إلى برنامج", description: "تحويل الاعتماد إلى عينات ومواد ومسار إنتاج ومتطلبات تغليف." },
        { title: "ضبط العملية", description: "مراقبة الانحراف في اللوح والسطح والتشكيل والطبقة الخلفية والتغليف." },
        { title: "التحقق من الدفعة", description: "مطابقة المنتج والطلب بالفحص قبل الشحن والاختبارات المناسبة." },
        { title: "الإفراج والتسليم", description: "تأكيد التغليف والملصقات والمنصات والوثائق وشروط الشحن." },
      ],
    },
    deliverables: {
      eyebrow: "ما الذي يستلمه المشتري",
      title: "ليس البضاعة فقط، بل أدلة تدعم القرار الداخلي والتواصل مع السوق.",
      body: "بحسب المنتج ونطاق المشروع، يمكن أن تشمل حزمة الجودة أربع مجموعات معلومات.",
      items: [
        { title: "خط أساس معتمد للمنتج", description: "تشكل المواصفة والعينة والمظهر والتغليف مرجعاً تنفيذياً واحداً." },
        { title: "سجلات جودة الدفعة", description: "بيانات الأبعاد والأسطح والوصلات والتغليف والتعريف." },
        { title: "تنسيق الاختبارات والمطابقة", description: "مواءمة الشهادات أو التقارير أو الاختبارات المتاحة مع المنتج والسوق." },
        { title: "معلومات الإفراج عن الشحنة", description: "ينشئ التغليف والمنصات والتحميل والاستثناءات سجلاً قابلاً للتتبع." },
      ],
    },
  },
};

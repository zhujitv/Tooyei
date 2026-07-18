import { Locale } from "@/generated/prisma/client";

type GlossaryEntry = {
  source: string;
  preserve?: boolean;
  translations?: Partial<Record<Locale, string>>;
};

export const buildingMaterialsGlossary: readonly GlossaryEntry[] = [
  { source: "SPC", preserve: true },
  { source: "WPC", preserve: true },
  { source: "LVT", preserve: true },
  { source: "wear layer", translations: { ZH: "耐磨层", DE: "Nutzschicht", JA: "耐摩耗層", FR: "couche d’usure", ES: "capa de uso", RU: "защитный слой", IT: "strato d'usura", AR: "طبقة التآكل" } },
  { source: "click lock", translations: { ZH: "锁扣系统", DE: "Klicksystem", JA: "クリックロック", FR: "système clipsable", ES: "sistema clic", RU: "замковая система", IT: "sistema a incastro", AR: "نظام النقر" } },
  { source: "underlay", translations: { ZH: "静音垫", DE: "Unterlage", JA: "アンダーレイ", FR: "sous-couche", ES: "base acústica", RU: "подложка", IT: "materassino", AR: "طبقة سفلية" } },
  { source: "embossed in register", translations: { ZH: "同步对花压纹", DE: "Synchronprägung", JA: "同調エンボス", FR: "relief synchronisé", ES: "relieve sincronizado", RU: "тиснение в регистр", IT: "goffratura sincronizzata", AR: "نقش متزامن" } },
  { source: "bevel", translations: { ZH: "倒角", DE: "Fase", JA: "面取り", FR: "chanfrein", ES: "bisel", RU: "фаска", IT: "bisello", AR: "حافة مشطوفة" } },
  { source: "waterproof", translations: { ZH: "防水", DE: "wasserfest", JA: "防水", FR: "étanche", ES: "impermeable", RU: "водостойкий", IT: "impermeabile", AR: "مقاوم للماء" } },
  { source: "formaldehyde", translations: { ZH: "甲醛", DE: "Formaldehyd", JA: "ホルムアルデヒド", FR: "formaldéhyde", ES: "formaldehído", RU: "формальдегид", IT: "formaldeide", AR: "الفورمالديهايد" } },
  { source: "slip resistance", translations: { ZH: "防滑性能", DE: "Rutschhemmung", JA: "防滑性能", FR: "résistance au glissement", ES: "resistencia al deslizamiento", RU: "сопротивление скольжению", IT: "resistenza allo scivolamento", AR: "مقاومة الانزلاق" } },
] as const;

export function getBuildingMaterialsGlossaryTerms(sourceJson: string, targetLocale: Locale) {
  const normalized = sourceJson.toLocaleLowerCase("en");
  return buildingMaterialsGlossary
    .filter((entry) => normalized.includes(entry.source.toLocaleLowerCase("en")))
    .map((entry) => ({
      source: entry.source,
      target: entry.preserve ? entry.source : entry.translations?.[targetLocale] ?? entry.source,
    }));
}

export function buildBuildingMaterialsGlossaryPrompt(sourceJson: string, targetLocale: Locale) {
  const matches = getBuildingMaterialsGlossaryTerms(sourceJson, targetLocale);
  if (!matches.length) return "";
  const rules = matches.map((entry) => `${entry.source} => ${entry.source === entry.target ? "preserve exactly" : entry.target}`);
  return `Building-materials glossary (mandatory terminology): ${rules.join("; ")}.`;
}

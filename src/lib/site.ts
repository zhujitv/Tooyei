export const siteConfig = {
  name: "TOOYEI",
  legalName: "Changzhou Tooyei New Material Co., Ltd.",
  description:
    "Factory-direct SPC, WPC, LVT and laminate flooring for wholesale, commercial and OEM projects.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tooyei.com",
  email: "kitty@tooyei.com",
  phone: "+86 180 1505 7611",
  whatsappDisplay: "+86 180 1500 7771",
} as const;

export const locales = ["en", "de", "fr", "es", "ru", "ja", "it", "ar", "zh"] as const;
export type Locale = (typeof locales)[number];
export const contentLocales = locales;
export type ContentLocale = Locale;
export const defaultLocale: Locale = "zh";

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export const localizedPath = (locale: Locale, path = "/") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
};

export const localizedAlternates = (path = "/") => ({
  ...Object.fromEntries(locales.map((locale) => [locale, localizedPath(locale, path)])),
  "x-default": path,
});

export const toContentLocale = (locale: Locale): ContentLocale => locale;

export const languageNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ru: "Русский",
  ja: "日本語",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
};

export const languageMarkers: Record<Locale, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  ru: "🇷🇺",
  ja: "🇯🇵",
  it: "🇮🇹",
  ar: "🇸🇦",
  zh: "🇨🇳",
};

export const localeDirection = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

export const openGraphLocales: Record<Locale, string> = {
  en: "en_US", de: "de_DE", fr: "fr_FR", es: "es_ES", ru: "ru_RU",
  ja: "ja_JP", it: "it_IT", ar: "ar_SA", zh: "zh_CN",
};

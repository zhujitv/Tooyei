export const siteConfig = {
  name: "TOOYEI",
  legalName: "Changzhou Tooyei New Material Co., Ltd.",
  description:
    "Factory-direct SPC, WPC, LVT and laminate flooring for wholesale, commercial and OEM projects.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tooyei.com",
  email: "kitty@tooyei.com",
  phone: "+86 180 1505 7611",
  whatsapp: "https://api.whatsapp.com/send?phone=8618015007771",
} as const;

export const locales = ["en", "es", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export const localizedPath = (locale: Locale, path = "/") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? normalized : `/${locale}${normalized}`;
};

export const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

import { Locale as DatabaseLocale } from "@/generated/prisma/client";
import type { Locale } from "@/lib/site";

export const databaseLocaleBySiteLocale: Record<Locale, DatabaseLocale> = {
  en: DatabaseLocale.EN,
  de: DatabaseLocale.DE,
  fr: DatabaseLocale.FR,
  es: DatabaseLocale.ES,
  ru: DatabaseLocale.RU,
  ja: DatabaseLocale.JA,
  it: DatabaseLocale.IT,
  ar: DatabaseLocale.AR,
  zh: DatabaseLocale.ZH,
};

export const siteLocaleByDatabaseLocale: Partial<Record<DatabaseLocale, Locale>> = Object.fromEntries(
  Object.entries(databaseLocaleBySiteLocale).map(([locale, databaseLocale]) => [databaseLocale, locale]),
) as Partial<Record<DatabaseLocale, Locale>>;

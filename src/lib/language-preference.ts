import { isLocale, type Locale } from "@/lib/site";

export const LANGUAGE_COOKIE = "tooyei_locale";
export const LANGUAGE_PROMPT_COOKIE = "tooyei_language_prompt";
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type WeightedLanguage = {
  language: string;
  quality: number;
  position: number;
};

export function detectPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage?.trim()) return "en";

  const preferences = acceptLanguage
    .split(",")
    .map((entry, position): WeightedLanguage | null => {
      const [tag, ...parameters] = entry.trim().split(";");
      const language = tag?.trim().toLowerCase().split("-")[0] ?? "";
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
      const quality = Number.isFinite(parsedQuality) ? parsedQuality : 0;

      if (!language || language === "*" || quality <= 0) return null;
      return { language, quality, position };
    })
    .filter((item): item is WeightedLanguage => item !== null)
    .sort((left, right) => right.quality - left.quality || left.position - right.position);

  return preferences.find(({ language }) => isLocale(language))?.language as Locale | undefined ?? "en";
}

export function isSearchCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;

  return /(?:bot|crawler|spider|slurp|bingpreview|google-inspectiontool|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot)/i.test(
    userAgent,
  );
}

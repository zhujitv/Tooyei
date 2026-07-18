import type { Locale } from "@/lib/site";

export function resolveArticleLocale(available: readonly Locale[], requested: Locale): Locale | null {
  if (available.includes(requested)) return requested;
  if (available.includes("en")) return "en";
  if (available.includes("zh")) return "zh";
  return null;
}

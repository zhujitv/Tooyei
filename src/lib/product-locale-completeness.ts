import { isSpecificationValueTranslatable } from "@/lib/translation/quality";

type LocaleKey = string;
type TranslationMap = Partial<Record<LocaleKey, Record<string, string | null | undefined>>>;

export type ProductLocaleCompletenessInput = {
  translations: Array<{
    locale: string;
    title?: string | null;
    summary?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }>;
  media: Array<{ visible?: boolean; translations?: TranslationMap }>;
  features: Array<{ visible?: boolean; translations?: TranslationMap }>;
  specifications: Array<{
    visible?: boolean;
    value?: string | null;
    unit?: string | null;
    translations?: TranslationMap;
  }>;
  applications: Array<{ visible?: boolean; translations?: TranslationMap }>;
  downloads: Array<{ visible?: boolean; translations?: TranslationMap }>;
};

export type ProductLocaleCompleteness = {
  locale: string;
  completed: number;
  total: number;
  percentage: number;
  complete: boolean;
  missing: string[];
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const rowTranslation = (row: { translations?: TranslationMap }, locale: string) => row.translations?.[locale];

export function resolveSpecificationDisplayValue({
  locale,
  sourceValue,
  unit,
  translatedDisplayValue,
  fallbackDisplayValue,
  translateValue,
}: {
  locale: string;
  sourceValue: string;
  unit?: string | null;
  translatedDisplayValue?: string | null;
  fallbackDisplayValue?: string | null;
  translateValue?: boolean;
}) {
  const raw = sourceValue.trim();
  const shouldTranslate = translateValue ?? isSpecificationValueTranslatable(raw, unit);
  return text(translatedDisplayValue)
    || (locale === "en" || !shouldTranslate ? raw : "")
    || text(fallbackDisplayValue)
    || raw;
}

export function calculateProductLocaleCompleteness(
  product: ProductLocaleCompletenessInput,
  locale: string,
): ProductLocaleCompleteness {
  const normalizedLocale = locale.toLowerCase();
  const sourceLocale = "en";
  const requirements: Array<{ label: string; complete: boolean }> = [];
  const main = product.translations.find((translation) => translation.locale.toLowerCase() === normalizedLocale);
  requirements.push(
    { label: "产品标题", complete: Boolean(text(main?.title)) },
    { label: "产品摘要", complete: Boolean(text(main?.summary)) },
    { label: "SEO 标题", complete: Boolean(text(main?.seoTitle)) },
    { label: "SEO 描述", complete: Boolean(text(main?.seoDescription)) },
  );

  product.media.filter((row) => row.visible !== false).forEach((row, index) => {
    requirements.push({ label: `媒体 ${index + 1} ALT`, complete: Boolean(text(rowTranslation(row, normalizedLocale)?.alt)) });
  });
  product.features.filter((row) => row.visible !== false).forEach((row, index) => {
    const source = rowTranslation(row, sourceLocale);
    const current = rowTranslation(row, normalizedLocale);
    requirements.push({ label: `卖点 ${index + 1} 标题`, complete: Boolean(text(current?.title)) });
    if (text(source?.description)) requirements.push({ label: `卖点 ${index + 1} 描述`, complete: Boolean(text(current?.description)) });
  });
  product.specifications.filter((row) => row.visible !== false).forEach((row, index) => {
    const source = rowTranslation(row, sourceLocale);
    const current = rowTranslation(row, normalizedLocale);
    const raw = text(row.value);
    const translateValue = isSpecificationValueTranslatable(text(source?.displayValue) || raw, row.unit);
    requirements.push({ label: `参数 ${index + 1} 名称`, complete: Boolean(text(current?.label)) });
    requirements.push({
      label: `参数 ${index + 1} 显示值`,
      complete: !translateValue || Boolean(text(current?.displayValue)),
    });
  });
  product.applications.filter((row) => row.visible !== false).forEach((row, index) => {
    const source = rowTranslation(row, sourceLocale);
    const current = rowTranslation(row, normalizedLocale);
    requirements.push({ label: `应用 ${index + 1} 标题`, complete: Boolean(text(current?.title)) });
    if (text(source?.description)) requirements.push({ label: `应用 ${index + 1} 描述`, complete: Boolean(text(current?.description)) });
    if (text(source?.imageAlt)) requirements.push({ label: `应用 ${index + 1} 图片 ALT`, complete: Boolean(text(current?.imageAlt)) });
  });
  product.downloads.filter((row) => row.visible !== false).forEach((row, index) => {
    requirements.push({ label: `下载资料 ${index + 1} 标题`, complete: Boolean(text(rowTranslation(row, normalizedLocale)?.title)) });
  });

  const completed = requirements.filter((requirement) => requirement.complete).length;
  const total = requirements.length;
  const percentage = total ? Math.round((completed / total) * 100) : 100;
  return {
    locale: normalizedLocale,
    completed,
    total,
    percentage,
    complete: completed === total,
    missing: requirements.filter((requirement) => !requirement.complete).map((requirement) => requirement.label),
  };
}

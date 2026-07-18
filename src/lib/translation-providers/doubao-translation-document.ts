export type DoubaoTranslationSegment = {
  key: string;
  text: string;
  maxLength: number;
};

type SourceItem = Record<string, string>;

export type DoubaoTranslationDocument = {
  product: SourceItem;
  media: SourceItem[];
  features: SourceItem[];
  specifications: SourceItem[];
  applications: SourceItem[];
  downloads: SourceItem[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const readString = (value: unknown) => typeof value === "string" ? value : "";

const readItem = (value: unknown, fields: readonly string[]): SourceItem => {
  const source = asRecord(value);
  return Object.fromEntries(fields.map((field) => [field, readString(source[field])])) as SourceItem;
};

const readItems = (value: unknown, fields: readonly string[]) =>
  Array.isArray(value) ? value.map((item) => readItem(item, fields)) : [];

export function parseDoubaoTranslationDocument(sourceJson: string): DoubaoTranslationDocument {
  const root = asRecord(JSON.parse(sourceJson) as unknown);
  return {
    product: readItem(root.product, ["title", "summary", "seoTitle", "seoDescription"]),
    media: readItems(root.media, ["id", "alt", "caption"]),
    features: readItems(root.features, ["id", "title", "description"]),
    specifications: readItems(root.specifications, ["id", "group", "label", "displayValue"]),
    applications: readItems(root.applications, ["id", "title", "description", "imageAlt"]),
    downloads: readItems(root.downloads, ["id", "title", "description"]),
  };
}

const sectionFields = {
  product: { title: 180, summary: 800, seoTitle: 70, seoDescription: 180 },
  media: { alt: 240, caption: 500 },
  features: { title: 180, description: 1200 },
  specifications: { group: 120, label: 180, displayValue: 500 },
  applications: { title: 180, description: 1200, imageAlt: 240 },
  downloads: { title: 180, description: 1200 },
} as const;

export function listDoubaoTranslationSegments(document: DoubaoTranslationDocument) {
  const segments: DoubaoTranslationSegment[] = [];
  const append = (key: string, text: string, maxLength: number) => {
    if (text.trim()) segments.push({ key, text, maxLength });
  };

  for (const [field, maxLength] of Object.entries(sectionFields.product)) {
    append(`product.${field}`, document.product[field], maxLength);
  }
  for (const section of ["media", "features", "specifications", "applications", "downloads"] as const) {
    document[section].forEach((item, index) => {
      for (const [field, maxLength] of Object.entries(sectionFields[section])) {
        append(`${section}.${index}.${field}`, item[field], maxLength);
      }
    });
  }
  return segments;
}

const fitText = (value: string, maxLength: number) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return { value: trimmed, truncated: false };
  const candidate = trimmed.slice(0, maxLength).trimEnd();
  const boundary = Math.max(
    candidate.lastIndexOf(" "),
    candidate.lastIndexOf("。"),
    candidate.lastIndexOf("；"),
    candidate.lastIndexOf("，"),
    candidate.lastIndexOf("."),
    candidate.lastIndexOf(";"),
    candidate.lastIndexOf(","),
  );
  const safe = boundary >= Math.floor(maxLength * 0.72)
    ? candidate.slice(0, boundary).trimEnd()
    : candidate;
  return { value: safe.replace(/[\s,，;；:：-]+$/u, ""), truncated: true };
};

export function buildDoubaoTranslationResult(
  document: DoubaoTranslationDocument,
  translations: ReadonlyMap<string, string>,
) {
  const warnings: string[] = [];
  const translated = (key: string, fallback: string, maxLength: number) => {
    if (!fallback.trim()) return "";
    const fitted = fitText(translations.get(key) ?? fallback, maxLength);
    if (fitted.truncated) warnings.push(`${key} 的译文超过 ${maxLength} 字符，已在安全边界截断，请人工复核。`);
    return fitted.value;
  };
  const mapItems = <T extends keyof Omit<typeof sectionFields, "product">>(section: T) =>
    document[section].map((item, index) => ({
      id: item.id,
      ...Object.fromEntries(Object.entries(sectionFields[section]).map(([field, maxLength]) => [
        field,
        translated(`${section}.${index}.${field}`, item[field], maxLength),
      ])),
    }) as SourceItem);

  return {
    output: {
      product: Object.fromEntries(Object.entries(sectionFields.product).map(([field, maxLength]) => [
        field,
        translated(`product.${field}`, document.product[field], maxLength),
      ])) as SourceItem,
      media: mapItems("media"),
      features: mapItems("features"),
      specifications: mapItems("specifications"),
      applications: mapItems("applications"),
      downloads: mapItems("downloads"),
    },
    warnings,
  };
}

export const isDoubaoTranslationModel = (model: string) =>
  /(?:^|[-_])seed[-_]translation(?:[-_]|$)/i.test(model.trim());

export const buildDoubaoTranslationRequestBody = ({
  model,
  text,
  sourceLanguage,
  targetLanguage,
  maxOutputTokens,
}: {
  model: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  maxOutputTokens: number;
}) => ({
  model,
  input: [{
    role: "user",
    content: [{
      type: "input_text",
      text,
      translation_options: {
        source_language: sourceLanguage,
        target_language: targetLanguage,
      },
    }],
  }],
  max_output_tokens: Math.min(3000, maxOutputTokens),
});

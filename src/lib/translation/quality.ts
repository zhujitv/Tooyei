import type { Locale } from "@/generated/prisma/client";
import { NON_TRANSLATABLE_TERMS } from "@/lib/translation/protected-terms";
import { hasTranslationContentType } from "@/lib/translation-worker-config";

export const TRANSLATION_QA_VERSION = "tooyei-translation-qa-v2";

export const SEO_DESCRIPTION_LIMITS: Record<string, { min: number; max: number }> = {
  EN: { min: 110, max: 170 },
  DE: { min: 110, max: 175 },
  FR: { min: 110, max: 175 },
  ES: { min: 110, max: 175 },
  RU: { min: 100, max: 170 },
  JA: { min: 55, max: 110 },
  AR: { min: 100, max: 170 },
  ZH: { min: 55, max: 110 },
  IT: { min: 110, max: 175 },
};

export type TranslationQaSeverity = "INFO" | "WARNING" | "ERROR";

export type TranslationQaIssue = {
  code: string;
  severity: TranslationQaSeverity;
  field: string;
  message: string;
  sourceValue?: string;
  translatedValue?: string;
};

export type TranslationQaStatus = "QA_PASSED" | "QA_WARNING" | "QA_FAILED" | "NEEDS_REVIEW";

export type TranslationQaResult = {
  status: TranslationQaStatus;
  passed: boolean;
  retryable: boolean;
  issues: TranslationQaIssue[];
  errors: TranslationQaIssue[];
  warnings: TranslationQaIssue[];
  retryInstructions: string[];
};

type TranslationQaItem = { id: string; [key: string]: string };

export type TranslationQaDocument = {
  product: { title: string; summary: string; seoTitle: string; seoDescription: string };
  media: TranslationQaItem[];
  features: TranslationQaItem[];
  specifications: TranslationQaItem[];
  applications: TranslationQaItem[];
  downloads: TranslationQaItem[];
};

const arabicDigitMap: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

const normalizeDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, (digit) => arabicDigitMap[digit] ?? digit);
const numericTokens = (value: string) => normalizeDigits(value)
  .match(/\d+(?:[.,]\d+)?/g)
  ?.map((token) => token.replace(",", ".")) ?? [];

const issue = (
  code: string,
  severity: TranslationQaSeverity,
  field: string,
  message: string,
  sourceValue?: string,
  translatedValue?: string,
): TranslationQaIssue => ({ code, severity, field, message, sourceValue, translatedValue });

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const occurrenceCount = (value: string, token: string) => {
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(token)}(?![\\p{L}\\p{N}])`, "giu");
  return value.match(pattern)?.length ?? 0;
};

export function validateProtectedTermIntegrity(source: string, target: string, field = "value") {
  const technicalPatterns = [
    /https?:\/\/[^\s<>()]+/giu,
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu,
    /\b(?:ISO|EN|ASTM|DIN|GB(?:\/T)?|JC\/T|CE)\s*[A-Z0-9][A-Z0-9./-]*\b/giu,
    /\b(?=[A-Z0-9./-]*[A-Z])(?=[A-Z0-9./-]*\d)[A-Z0-9][A-Z0-9./-]*\b/gu,
  ];
  const tokens = new Set<string>();
  for (const term of NON_TRANSLATABLE_TERMS) {
    if (occurrenceCount(source, term)) tokens.add(term);
  }
  for (const pattern of technicalPatterns) {
    for (const match of source.match(pattern) ?? []) tokens.add(match);
  }
  return Array.from(tokens).flatMap((token) => {
    const expected = occurrenceCount(source, token);
    const actual = occurrenceCount(target, token);
    return actual === expected ? [] : [issue(
      "PROTECTED_TERM_CHANGED",
      "ERROR",
      field,
      `受保护术语或技术标识“${token}”应保留 ${expected} 次，实际为 ${actual} 次。`,
      source,
      target,
    )];
  });
}

export function validateNumericIntegrity(source: string, target: string, field = "value") {
  const issues: TranslationQaIssue[] = [];
  const sourceNumbers = numericTokens(source);
  const targetNumbers = numericTokens(target);
  if (sourceNumbers.join("|") !== targetNumbers.join("|")) {
    issues.push(issue(
      "NUMERIC_VALUE_CHANGED",
      "ERROR",
      field,
      `数字或顺序发生变化：${sourceNumbers.join(" / ") || "无"} → ${targetNumbers.join(" / ") || "无"}。`,
      source,
      target,
    ));
  }

  const structureCount = (value: string, pattern: RegExp) => (value.match(pattern) ?? []).length;
  const structures = [
    ["PERCENT_STRUCTURE_CHANGED", /[%٪]/g, "百分号"],
    ["DIMENSION_STRUCTURE_CHANGED", /[×xX*]/g, "尺寸乘号"],
    ["LIST_STRUCTURE_CHANGED", /\//g, "斜杠列表"],
  ] as const;
  for (const [code, pattern, label] of structures) {
    if (structureCount(source, pattern) !== structureCount(target, pattern)) {
      issues.push(issue(code, "ERROR", field, `${label}结构发生变化。`, source, target));
    }
  }

  const standardPattern = /\b(?:ISO|EN|ASTM|DIN|GB(?:\/T)?|JC\/T|CE)\s*[A-Z0-9][A-Z0-9./-]*\b/giu;
  const standards = (value: string) => (value.match(standardPattern) ?? []).map((token) => token.replace(/\s+/g, "").toUpperCase());
  if (standards(source).join("|") !== standards(target).join("|")) {
    issues.push(issue("STANDARD_CODE_CHANGED", "ERROR", field, "标准编号发生变化。", source, target));
  }
  return issues;
}

const scriptPatterns = {
  Thai: /\p{Script=Thai}/u,
  Hangul: /\p{Script=Hangul}/u,
  Cyrillic: /\p{Script=Cyrillic}/u,
  Hiragana: /\p{Script=Hiragana}/u,
  Katakana: /\p{Script=Katakana}/u,
  Han: /\p{Script=Han}/u,
  Arabic: /\p{Script=Arabic}/u,
} as const;

const allowedScripts: Record<string, Set<keyof typeof scriptPatterns>> = {
  AR: new Set(["Arabic"]),
  ZH: new Set(["Han"]),
  JA: new Set(["Han", "Hiragana", "Katakana"]),
  RU: new Set(["Cyrillic"]),
  EN: new Set(), DE: new Set(), FR: new Set(), ES: new Set(), IT: new Set(),
};

export function validateTargetLanguageScript(text: string, targetLocale: Locale | string, field = "value") {
  const allowed = allowedScripts[String(targetLocale).toUpperCase()] ?? new Set<keyof typeof scriptPatterns>();
  const found = Object.entries(scriptPatterns)
    .filter(([name, pattern]) => !allowed.has(name as keyof typeof scriptPatterns) && pattern.test(text))
    .map(([name]) => name);
  return found.length
    ? [issue(
        "TARGET_SCRIPT_CONTAMINATION",
        "ERROR",
        field,
        `目标语言中混入了不允许的文字体系：${found.join("、")}。`,
        undefined,
        text,
      )]
    : [];
}

const repeatedWordIgnore = new Set(NON_TRANSLATABLE_TERMS.map((term) => term.toLocaleLowerCase("en")));

export function detectRepeatedWords(text: string, locale: Locale | string = "EN") {
  const caseLocale = String(locale).toLowerCase();
  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const repeated: string[] = [];
  for (let index = 1; index < words.length; index += 1) {
    const current = words[index].toLocaleLowerCase(caseLocale);
    const previous = words[index - 1].toLocaleLowerCase(caseLocale);
    if (current !== previous || repeatedWordIgnore.has(current) || /^\d+$/u.test(current)) continue;
    repeated.push(words[index]);
  }
  return repeated;
}

const promptLeakPattern = /(previous output failed|protected placeholders|return only|system prompt|translation_options)/iu;
const markupPattern = /<\/?[a-z][^>]*>|```|^#{1,6}\s|\*\*[^*]+\*\*/imu;
const onlyPunctuationPattern = /^[\p{P}\p{S}\s]+$/u;
const badEndingPattern = /[,，、;；:：\-–—/]$/u;
const trailingConnectors: Record<string, RegExp> = {
  EN: /\b(?:and|or|with|for|to|of|the|a|an)$/iu,
  DE: /\b(?:und|oder|mit|für|von|der|die|das)$/iu,
  FR: /\b(?:et|ou|avec|pour|de|du|la|le)$/iu,
  ES: /\b(?:y|o|con|para|de|del|la|el)$/iu,
  IT: /\b(?:e|o|con|per|di|del|la|il)$/iu,
  RU: /\b(?:и|или|с|для|из)$/iu,
  AR: /(?:و|أو|مع|من|إلى)$/u,
  ZH: /(?:和|与|及|或|以及|用于)$/u,
  JA: /(?:と|や|および|または|の)$/u,
};

function validateBasicText({
  source,
  target,
  targetLocale,
  field,
  required,
  description,
}: {
  source: string;
  target: string;
  targetLocale: Locale | string;
  field: string;
  required: boolean;
  description: boolean;
}) {
  const issues: TranslationQaIssue[] = [];
  const trimmed = target.trim();
  if (required && !trimmed) {
    return [issue("REQUIRED_TRANSLATION_MISSING", "ERROR", field, "必填译文字段为空。", source, target)];
  }
  if (!trimmed) return issues;
  if (onlyPunctuationPattern.test(trimmed)) issues.push(issue("PUNCTUATION_ONLY", "ERROR", field, "译文只有标点符号。", source, target));
  if (markupPattern.test(trimmed)) issues.push(issue("MARKUP_CONTAMINATION", "ERROR", field, "译文混入 HTML 或 Markdown。", source, target));
  if (/^\s*[\[{][\s\S]*[\]}]\s*$/u.test(trimmed)) issues.push(issue("JSON_WRAPPER", "ERROR", field, "译文字段被 JSON 包裹。", source, target));
  if (promptLeakPattern.test(trimmed)) issues.push(issue("PROMPT_LEAK", "ERROR", field, "译文混入了 Prompt 指令。", source, target));
  if (description && (badEndingPattern.test(trimmed) || trailingConnectors[String(targetLocale).toUpperCase()]?.test(trimmed))) {
    issues.push(issue("TRUNCATED_SENTENCE", "ERROR", field, "译文疑似以连接词或残缺短语结尾。", source, target));
  }
  const repeated = detectRepeatedWords(trimmed, targetLocale);
  if (repeated.length) issues.push(issue("REPEATED_WORD", "ERROR", field, `检测到连续重复词：${repeated.join("、")}。`, source, target));
  issues.push(...validateNumericIntegrity(source, target, field));
  issues.push(...validateProtectedTermIntegrity(source, target, field));
  issues.push(...validateTargetLanguageScript(trimmed, targetLocale, field));
  return issues;
}

const findById = (rows: TranslationQaItem[], id: string) => rows.find((row) => row.id === id);

export function validateProductTranslation({
  source,
  target,
  targetLocale,
  contentTypes,
}: {
  source: TranslationQaDocument;
  target: TranslationQaDocument;
  targetLocale: Locale | string;
  contentTypes: readonly string[];
}) {
  const issues: TranslationQaIssue[] = [];
  const check = (field: string, sourceValue: string, targetValue: string, required = Boolean(sourceValue.trim()), description = false) => {
    issues.push(...validateBasicText({ source: sourceValue, target: targetValue, targetLocale, field, required, description }));
  };

  if (hasTranslationContentType(contentTypes, "PRODUCT")) {
    check("product.title", source.product.title, target.product.title, true);
    check("product.summary", source.product.summary, target.product.summary, true, true);
    if (/[.!?。！？]$/u.test(target.product.title.trim())) issues.push(issue("TITLE_ENDING_PUNCTUATION", "WARNING", "product.title", "产品标题末尾包含句号或感叹/疑问标点。", source.product.title, target.product.title));
    if (target.product.title.length > 180) issues.push(issue("TITLE_TOO_LONG", "WARNING", "product.title", "产品标题超过 180 个字符。", source.product.title, target.product.title));
    if (target.product.summary && target.product.summary.length < 20) issues.push(issue("SUMMARY_TOO_SHORT", "WARNING", "product.summary", "产品摘要异常简短。", source.product.summary, target.product.summary));
  }
  if (hasTranslationContentType(contentTypes, "SEO")) {
    check("product.seoTitle", source.product.seoTitle, target.product.seoTitle, true);
    check("product.seoDescription", source.product.seoDescription, target.product.seoDescription, true, true);
    if (target.product.seoTitle.length > 70) issues.push(issue("SEO_TITLE_TOO_LONG", "ERROR", "product.seoTitle", "SEO 标题超过 70 个字符。", source.product.seoTitle, target.product.seoTitle));
    const limits = SEO_DESCRIPTION_LIMITS[String(targetLocale).toUpperCase()] ?? { min: 100, max: 175 };
    if (target.product.seoDescription.length > limits.max) {
      issues.push(issue("SEO_DESCRIPTION_TOO_LONG", "ERROR", "product.seoDescription", `SEO 描述超过 ${limits.max} 个字符，必须重写完整句，禁止硬截断。`, source.product.seoDescription, target.product.seoDescription));
    } else if (target.product.seoDescription && target.product.seoDescription.length < limits.min) {
      issues.push(issue("SEO_DESCRIPTION_TOO_SHORT", "WARNING", "product.seoDescription", `SEO 描述少于建议的 ${limits.min} 个字符。`, source.product.seoDescription, target.product.seoDescription));
    } else if (target.product.seoDescription.length >= Math.floor(limits.max * 0.92)) {
      issues.push(issue("SEO_DESCRIPTION_NEAR_LIMIT", "WARNING", "product.seoDescription", "SEO 描述已接近字符上限。", source.product.seoDescription, target.product.seoDescription));
    }
  }

  const checkRows = (
    section: keyof Omit<TranslationQaDocument, "product">,
    fields: Array<{ name: string; enabled: boolean; description?: boolean; optional?: boolean }>,
  ) => {
    for (const sourceRow of source[section]) {
      const targetRow = findById(target[section], sourceRow.id);
      if (!targetRow) {
        issues.push(issue("STRUCTURED_ITEM_MISSING", "ERROR", `${section}.${sourceRow.id}`, "结构化内容项目缺失。", sourceRow.id));
        continue;
      }
      for (const field of fields) {
        if (!field.enabled) continue;
        check(
          `${section}.${sourceRow.id}.${field.name}`,
          sourceRow[field.name] ?? "",
          targetRow[field.name] ?? "",
          field.optional ? false : Boolean((sourceRow[field.name] ?? "").trim()),
          Boolean(field.description),
        );
      }
    }
  };

  checkRows("media", [
    { name: "alt", enabled: hasTranslationContentType(contentTypes, "MEDIA_ALT") },
    { name: "caption", enabled: hasTranslationContentType(contentTypes, "MEDIA_CAPTION"), description: true, optional: true },
  ]);
  checkRows("features", [
    { name: "title", enabled: hasTranslationContentType(contentTypes, "FEATURE_TITLE") },
    { name: "description", enabled: hasTranslationContentType(contentTypes, "FEATURE_DESCRIPTION"), description: true },
  ]);
  checkRows("specifications", [
    { name: "group", enabled: hasTranslationContentType(contentTypes, "SPEC_LABEL"), optional: true },
    { name: "label", enabled: hasTranslationContentType(contentTypes, "SPEC_LABEL") },
    { name: "displayValue", enabled: hasTranslationContentType(contentTypes, "SPEC_VALUE") },
  ]);
  checkRows("applications", [
    { name: "title", enabled: hasTranslationContentType(contentTypes, "APPLICATION_TITLE") },
    { name: "description", enabled: hasTranslationContentType(contentTypes, "APPLICATION_DESCRIPTION"), description: true },
    { name: "imageAlt", enabled: hasTranslationContentType(contentTypes, "APPLICATION_DESCRIPTION"), optional: true },
  ]);
  checkRows("downloads", [
    { name: "title", enabled: hasTranslationContentType(contentTypes, "DOWNLOAD_TITLE") },
    { name: "description", enabled: false, optional: true },
  ]);

  const errors = issues.filter((entry) => entry.severity === "ERROR");
  const warnings = issues.filter((entry) => entry.severity === "WARNING");
  return {
    status: errors.length ? "QA_FAILED" : warnings.length ? "QA_WARNING" : "QA_PASSED",
    passed: errors.length === 0,
    retryable: errors.length > 0,
    issues,
    errors,
    warnings,
    retryInstructions: errors.map((entry) => `${entry.field}: ${entry.message}`),
  } satisfies TranslationQaResult;
}

export type ProductSpecificationTranslationInput = {
  specificationId: string;
  group: string | null;
  label: string;
  sourceValue: string;
  unit: string | null;
  translateLabel: boolean;
  translateValue: boolean;
};

export function isSpecificationValueTranslatable(sourceValue: string, unit?: string | null) {
  let remainder = sourceValue;
  if (unit?.trim()) remainder = remainder.replace(new RegExp(unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu"), "");
  remainder = remainder
    .replace(/https?:\/\/\S+/giu, "")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu, "")
    .replace(/\b(?:ISO|EN|ASTM|DIN|GB(?:\/T)?|JC\/T|CE)\s*[A-Z0-9][A-Z0-9./-]*\b/giu, "")
    .replace(/\b(?=[A-Z0-9./-]*[A-Z])(?=[A-Z0-9./-]*\d)[A-Z0-9][A-Z0-9./-]*\b/gu, "")
    .replace(/[\d٠-٩۰-۹.,%٪×xX*\/\-–—+<>=~()\[\]\s]/gu, "");
  for (const term of NON_TRANSLATABLE_TERMS) remainder = remainder.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu"), "");
  return /\p{L}/u.test(remainder);
}

export function qaStatusCountsAsCompleted(status: string) {
  return status === "QA_PASSED" || status === "QA_WARNING" || status === "SKIPPED";
}

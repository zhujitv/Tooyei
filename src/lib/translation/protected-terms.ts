export const NON_TRANSLATABLE_TERMS = [
  "TOOYEI",
  "SPC",
  "EIR",
  "IXPE",
  "EVA",
  "PVC",
  "WPC",
  "LVT",
  "LSPC",
  "VSPC",
  "ESPC",
  "OEM",
  "ODM",
  "OEM/ODM",
  "2G",
  "5G",
  "14F",
  "Unilin",
  "Välinge",
  "CORK",
] as const;

export type ProtectedTermMap = Record<string, string>;

export type ProtectedTermEntry = {
  marker: string;
  source: string;
  target: string;
  expectedCount: number;
};

export type ProtectedTranslationText = {
  text: string;
  map: ProtectedTermMap;
  entries: ProtectedTermEntry[];
};

export type ProtectedPlaceholderIssue = {
  code: "PLACEHOLDER_MISSING" | "PLACEHOLDER_DUPLICATED" | "PLACEHOLDER_ADDED" | "PLACEHOLDER_REORDERED";
  marker: string;
  message: string;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const markerPattern = /\[\[TERM_\d+\]\]/g;

const countOccurrences = (value: string, needle: string) => {
  if (!needle) return 0;
  return value.split(needle).length - 1;
};

const replacePattern = (
  current: ProtectedTranslationText,
  pattern: RegExp,
  targetFor: (source: string) => string,
) => {
  const entries = current.entries.map((entry) => ({ ...entry }));
  const map = { ...current.map };
  const created = new Map<string, number>();
  const text = current.text.replace(pattern, (source) => {
    const key = pattern.ignoreCase ? source.toLocaleLowerCase("en") : source;
    let index = created.get(key);
    if (index === undefined) {
      index = entries.length;
      const marker = `[[TERM_${index}]]`;
      const target = targetFor(source);
      entries.push({ marker, source, target, expectedCount: 0 });
      map[marker] = target;
      created.set(key, index);
    }
    entries[index].expectedCount += 1;
    return entries[index].marker;
  });

  return { text, entries, map };
};

export function protectTranslationText(
  value: string,
  glossaryTerms: Array<{ source: string; target: string }> = [],
): ProtectedTranslationText {
  let protectedValue: ProtectedTranslationText = { text: value, map: {}, entries: [] };
  const explicitTerms = [
    ...glossaryTerms,
    ...NON_TRANSLATABLE_TERMS.map((source) => ({ source, target: source })),
  ]
    .filter((term) => term.source.trim() && term.target.trim())
    .sort((left, right) => right.source.length - left.source.length);

  for (const term of explicitTerms) {
    if (protectedValue.entries.some((entry) => entry.source.toLocaleLowerCase("en") === term.source.toLocaleLowerCase("en"))) continue;
    protectedValue = replacePattern(
      protectedValue,
      new RegExp(escapeRegex(term.source), "giu"),
      () => term.target,
    );
  }

  const technicalPatterns = [
    /https?:\/\/[^\s<>()]+/giu,
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu,
    /\b(?:ISO|EN|ASTM|DIN|GB(?:\/T)?|JC\/T|CE)\s*[A-Z0-9][A-Z0-9./-]*\b/giu,
    /\b(?=[A-Z0-9./-]*[A-Z])(?=[A-Z0-9./-]*\d)[A-Z0-9][A-Z0-9./-]*\b/gu,
    /(?<![\p{L}\p{N}_])\d+(?:[.,]\d+)?(?:\s*[×xX*\/\-]\s*\d+(?:[.,]\d+)?)+(?:\s*%)?/gu,
    /(?<![\p{L}\p{N}_])\d+(?:[.,]\d+)?\s*%/gu,
    /(?<![\p{L}\p{N}_])\d+(?:[.,]\d+)?/gu,
  ];
  for (const pattern of technicalPatterns) {
    protectedValue = replacePattern(protectedValue, pattern, (source) => source);
  }
  return protectedValue;
}

export function validateProtectedPlaceholders(
  translatedText: string,
  protectedValue: ProtectedTranslationText,
) {
  const issues: ProtectedPlaceholderIssue[] = [];
  for (const entry of protectedValue.entries) {
    const actualCount = countOccurrences(translatedText, entry.marker);
    if (actualCount < entry.expectedCount) {
      issues.push({
        code: "PLACEHOLDER_MISSING",
        marker: entry.marker,
        message: `${entry.marker} 应出现 ${entry.expectedCount} 次，实际仅 ${actualCount} 次。`,
      });
    } else if (actualCount > entry.expectedCount) {
      issues.push({
        code: "PLACEHOLDER_DUPLICATED",
        marker: entry.marker,
        message: `${entry.marker} 应出现 ${entry.expectedCount} 次，实际出现 ${actualCount} 次。`,
      });
    }
  }

  const known = new Set(Object.keys(protectedValue.map));
  for (const marker of translatedText.match(markerPattern) ?? []) {
    if (!known.has(marker)) {
      issues.push({ code: "PLACEHOLDER_ADDED", marker, message: `模型新增了源内容中不存在的占位符 ${marker}。` });
    }
  }
  const expectedOrder = protectedValue.text.match(markerPattern) ?? [];
  const actualOrder = translatedText.match(markerPattern) ?? [];
  if (
    !issues.length
    && expectedOrder.length === actualOrder.length
    && expectedOrder.some((marker, index) => marker !== actualOrder[index])
  ) {
    issues.push({
      code: "PLACEHOLDER_REORDERED",
      marker: actualOrder.join(" → "),
      message: "模型改变了受保护占位符的原始顺序。",
    });
  }
  return issues;
}

export function restoreProtectedTerms(
  translatedText: string,
  protectedValue: ProtectedTranslationText,
) {
  let restored = translatedText;
  for (const entry of protectedValue.entries) {
    restored = restored.replaceAll(entry.marker, entry.target);
  }
  return restored;
}

export function validateRestoredTerms(
  restoredText: string,
  protectedValue: ProtectedTranslationText,
) {
  return protectedValue.entries.flatMap((entry) => {
    const actualCount = countOccurrences(restoredText.toLocaleLowerCase("en"), entry.target.toLocaleLowerCase("en"));
    return actualCount < entry.expectedCount
      ? [{
          code: "PROTECTED_TERM_MISSING" as const,
          term: entry.target,
          message: `受保护内容“${entry.target}”应保留 ${entry.expectedCount} 次，实际仅 ${actualCount} 次。`,
        }]
      : [];
  });
}

export const protectedPlaceholderInstruction = [
  "Protected placeholders such as [[TERM_0]] must be copied exactly.",
  "Do not translate, remove, reorder, duplicate, split, or modify them.",
  "Return only the requested translated content.",
].join(" ");

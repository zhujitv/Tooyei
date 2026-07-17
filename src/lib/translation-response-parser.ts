const coreFieldAliases = {
  title: ["title"],
  summary: ["summary", "description"],
  seoTitle: ["seoTitle", "seo_title"],
  seoDescription: ["seoDescription", "seo_description"],
  content: ["content", "body"],
} as const;

export type TranslationCoreFields = {
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
};

type ParseErrorContext = {
  responseId?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
};

export class TranslationResponseParseError extends Error {
  readonly name = "TranslationResponseParseError";
  readonly errorType = "RESPONSE_PARSE";
  readonly rawResponse: string;
  responseId: string | null = null;
  promptTokens: number | null = null;
  completionTokens: number | null = null;
  totalTokens: number | null = null;

  constructor(rawResponse: string, message = "模型响应无法解析为有效 JSON。") {
    super(message);
    this.rawResponse = rawResponse;
  }

  withContext(context: ParseErrorContext) {
    this.responseId = context.responseId ?? null;
    this.promptTokens = context.promptTokens ?? null;
    this.completionTokens = context.completionTokens ?? null;
    this.totalTokens = context.totalTokens ?? null;
    return this;
  }
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const stripMarkdownFence = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (match?.[1] ?? trimmed).trim();
};

export function extractJsonObjectCandidates(value: string): string[] {
  const candidates: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (start < 0) {
      if (character === "{") {
        start = index;
        depth = 1;
        inString = false;
        escaped = false;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        candidates.push(value.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return candidates;
}

export function parseTranslationResponse(rawResponse: string): Record<string, unknown> {
  const normalized = stripMarkdownFence(rawResponse);
  const attempts = [normalized, ...extractJsonObjectCandidates(normalized)];

  for (const candidate of attempts) {
    try {
      const record = asRecord(JSON.parse(candidate));
      if (record) return record;
    } catch {
      // Try the next balanced JSON object. This intentionally does not use a
      // greedy regular expression because translated HTML may contain braces.
    }
  }

  throw new TranslationResponseParseError(rawResponse);
}

export const translationValueToString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export function readTranslationString(
  record: Record<string, unknown>,
  aliases: readonly string[],
) {
  for (const alias of aliases) {
    if (Object.hasOwn(record, alias)) return translationValueToString(record[alias]);
  }
  return "";
}

export function normalizeTranslationCoreFields(record: Record<string, unknown>) {
  const warnings: string[] = [];
  const output = {} as TranslationCoreFields;

  for (const [field, aliases] of Object.entries(coreFieldAliases) as Array<
    [keyof TranslationCoreFields, readonly string[]]
  >) {
    const found = aliases.some((alias) => Object.hasOwn(record, alias));
    output[field] = readTranslationString(record, aliases);
    if (!found) warnings.push(`模型响应缺少 ${field}，已使用空字符串。`);
  }

  return { output, warnings };
}

export type ArticleContentBlock = {
  id: string;
  type: "paragraph" | "heading" | "list" | "quote";
  text: string;
  level?: 2 | 3;
};

export type ArticleContent = {
  version: 1;
  blocks: ArticleContentBlock[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const blockTypes = new Set<ArticleContentBlock["type"]>(["paragraph", "heading", "list", "quote"]);

export const emptyArticleContent = (): ArticleContent => ({ version: 1, blocks: [] });

export function normalizeArticleContent(value: unknown): ArticleContent {
  const root = asRecord(value);
  const sourceBlocks = Array.isArray(root?.blocks) ? root.blocks : Array.isArray(value) ? value : [];
  const blocks = sourceBlocks.flatMap((candidate, index): ArticleContentBlock[] => {
    const record = asRecord(candidate);
    const text = typeof record?.text === "string" ? record.text.trim() : "";
    const type = typeof record?.type === "string" && blockTypes.has(record.type as ArticleContentBlock["type"])
      ? record.type as ArticleContentBlock["type"]
      : "paragraph";
    if (!text) return [];
    const level = type === "heading" && record?.level === 3 ? 3 : type === "heading" ? 2 : undefined;
    return [{
      id: typeof record?.id === "string" && record.id.trim() ? record.id.trim() : `block-${index + 1}`,
      type,
      text,
      ...(level ? { level } : {}),
    }];
  });
  return { version: 1, blocks };
}

export function articleContentFromEditor(value: string): ArticleContent {
  const sections = value.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  return {
    version: 1,
    blocks: sections.map((section, index) => {
      const id = `block-${index + 1}`;
      if (section.startsWith("### ")) return { id, type: "heading", level: 3, text: section.slice(4).trim() };
      if (section.startsWith("## ")) return { id, type: "heading", level: 2, text: section.slice(3).trim() };
      if (section.startsWith("> ")) return { id, type: "quote", text: section.slice(2).trim() };
      const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length && lines.every((line) => line.startsWith("- "))) {
        return { id, type: "list", text: lines.map((line) => line.slice(2).trim()).join("\n") };
      }
      return { id, type: "paragraph", text: section };
    }),
  };
}

export function articleContentToEditor(value: unknown) {
  return normalizeArticleContent(value).blocks.map((block) => {
    if (block.type === "heading") return `${block.level === 3 ? "###" : "##"} ${block.text}`;
    if (block.type === "quote") return `> ${block.text}`;
    if (block.type === "list") return block.text.split("\n").map((item) => `- ${item}`).join("\n");
    return block.text;
  }).join("\n\n");
}

export function articleReadingMinutes(value: unknown) {
  const text = normalizeArticleContent(value).blocks.map((block) => block.text).join(" ");
  const latinWords = text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  const cjkCharacters = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  return Math.max(1, Math.ceil((latinWords + cjkCharacters / 2) / 220));
}

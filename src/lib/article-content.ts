export type ArticleContentBlock = {
  id: string;
  type: "paragraph" | "heading" | "list" | "quote" | "image";
  text: string;
  level?: 2 | 3;
  assetId?: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type ArticleContent = {
  version: 1;
  blocks: ArticleContentBlock[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const blockTypes = new Set<ArticleContentBlock["type"]>(["paragraph", "heading", "list", "quote", "image"]);

const optionalPositiveInteger = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 20000 ? value : undefined;

const blockId = (record: Record<string, unknown> | null, index: number) =>
  typeof record?.id === "string" && record.id.trim() ? record.id.trim().slice(0, 120) : `block-${index + 1}`;

export const emptyArticleContent = (): ArticleContent => ({ version: 1, blocks: [] });

export function normalizeArticleContent(value: unknown): ArticleContent {
  const root = asRecord(value);
  const sourceBlocks = Array.isArray(root?.blocks) ? root.blocks : Array.isArray(value) ? value : [];
  const blocks = sourceBlocks.flatMap((candidate, index): ArticleContentBlock[] => {
    const record = asRecord(candidate);
    const type = typeof record?.type === "string" && blockTypes.has(record.type as ArticleContentBlock["type"])
      ? record.type as ArticleContentBlock["type"]
      : "paragraph";
    if (type === "image") {
      const assetId = typeof record?.assetId === "string" ? record.assetId.trim() : "";
      const url = typeof record?.url === "string" ? record.url.trim() : "";
      if (!assetId || !url) return [];
      const alt = typeof record?.alt === "string" ? record.alt.trim() : "";
      const caption = typeof record?.caption === "string" ? record.caption.trim() : "";
      return [{
        id: blockId(record, index),
        type,
        text: caption || alt,
        assetId,
        url,
        alt,
        caption,
        ...(optionalPositiveInteger(record?.width) ? { width: optionalPositiveInteger(record?.width) } : {}),
        ...(optionalPositiveInteger(record?.height) ? { height: optionalPositiveInteger(record?.height) } : {}),
      }];
    }
    const text = typeof record?.text === "string" ? record.text.trim() : "";
    if (!text) return [];
    const level = type === "heading" && record?.level === 3 ? 3 : type === "heading" ? 2 : undefined;
    return [{
      id: blockId(record, index),
      type,
      text,
      ...(level ? { level } : {}),
    }];
  });
  return { version: 1, blocks };
}

export function parseArticleContentJson(value: string): ArticleContent {
  if (!value.trim()) return emptyArticleContent();
  if (value.length > 250_000) throw new Error("文章正文数据超过 250 KB 限制。");
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("文章正文数据格式无效，请刷新页面后重试。");
  }
  const root = asRecord(parsed);
  if (!root || !Array.isArray(root.blocks)) throw new Error("文章正文缺少内容块。");
  if (root.blocks.length > 150) throw new Error("一篇文章最多支持 150 个内容块。");
  for (const [index, candidate] of root.blocks.entries()) {
    const record = asRecord(candidate);
    const type = typeof record?.type === "string" ? record.type : "";
    if (!record || !blockTypes.has(type as ArticleContentBlock["type"])) throw new Error(`第 ${index + 1} 个内容块类型无效。`);
    if (type === "image") {
      if (typeof record.assetId !== "string" || !record.assetId.trim() || typeof record.url !== "string" || !record.url.trim()) {
        throw new Error(`第 ${index + 1} 个图片块尚未完成上传。`);
      }
      continue;
    }
    if (typeof record.text !== "string" || !record.text.trim()) throw new Error(`第 ${index + 1} 个内容块为空。`);
    if (record.text.length > 20_000) throw new Error(`第 ${index + 1} 个内容块超过 20,000 字符限制。`);
  }
  const normalized = normalizeArticleContent(parsed);
  if (normalized.blocks.length !== root.blocks.length) throw new Error("部分文章内容块无法识别，请检查后重试。");
  return normalized;
}

export function articleImageAssetIds(value: unknown) {
  return normalizeArticleContent(value).blocks.flatMap((block) => block.type === "image" && block.assetId ? [block.assetId] : []);
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
    if (block.type === "image") return `[Image: ${block.alt || block.caption || block.assetId}]`;
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

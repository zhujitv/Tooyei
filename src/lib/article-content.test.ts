import assert from "node:assert/strict";
import test from "node:test";
import { articleContentFromEditor, articleContentToEditor, articleImageAssetIds, normalizeArticleContent, parseArticleContentJson } from "@/lib/article-content";

test("article editor content becomes stable structured blocks", () => {
  const content = articleContentFromEditor("## Heading\n\nParagraph text.\n\n- One\n- Two\n\n> Quote");
  assert.deepEqual(content.blocks.map(({ type }) => type), ["heading", "paragraph", "list", "quote"]);
  assert.equal(content.blocks[2]?.text, "One\nTwo");
  assert.match(articleContentToEditor(content), /## Heading/);
});

test("invalid article JSON is normalized without throwing", () => {
  assert.deepEqual(normalizeArticleContent(null), { version: 1, blocks: [] });
  assert.deepEqual(normalizeArticleContent({ blocks: [{ type: "paragraph", text: "  Body  " }] }).blocks[0], {
    id: "block-1", type: "paragraph", text: "Body",
  });
});

test("article image blocks preserve managed asset metadata", () => {
  const content = parseArticleContentJson(JSON.stringify({ version: 1, blocks: [{
    id: "image-1", type: "image", text: "Caption", assetId: "asset-1", url: "https://example.com/image.jpg",
    alt: "SPC flooring plank detail", caption: "Wear layer detail", width: 1600, height: 900,
  }] }));
  assert.equal(content.blocks[0]?.type, "image");
  assert.equal(content.blocks[0]?.alt, "SPC flooring plank detail");
  assert.deepEqual(articleImageAssetIds(content), ["asset-1"]);
});

test("article image blocks cannot be saved before upload completes", () => {
  assert.throws(() => parseArticleContentJson(JSON.stringify({ version: 1, blocks: [{ id: "image-1", type: "image", text: "" }] })), /尚未完成上传/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { articleContentFromEditor, articleContentToEditor, normalizeArticleContent } from "@/lib/article-content";

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

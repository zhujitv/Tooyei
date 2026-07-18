import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDoubaoTranslationRequestBody,
  buildDoubaoTranslationResult,
  isDoubaoTranslationModel,
  listDoubaoTranslationSegments,
  parseDoubaoTranslationDocument,
} from "./doubao-translation-document";

const sourceJson = JSON.stringify({
  product: {
    title: "SPC flooring",
    summary: "Waterproof click flooring.",
    seoTitle: "SPC flooring",
    seoDescription: "Commercial SPC flooring.",
  },
  media: [{ id: "asset-1", alt: "Oak floor", caption: "" }],
  features: [{ id: "feature-1", title: "Waterproof", description: "For busy interiors." }],
  specifications: [{ id: "spec-1", group: "Performance", label: "Wear layer", displayValue: "0.5 mm" }],
  applications: [],
  downloads: [],
});

test("builds stable translation segments and reconstructs product JSON without translating IDs", () => {
  const document = parseDoubaoTranslationDocument(sourceJson);
  const segments = listDoubaoTranslationSegments(document);
  assert.ok(segments.some((segment) => segment.key === "product.title" && segment.text === "SPC flooring"));
  assert.ok(segments.some((segment) => segment.key === "specifications.0.displayValue"));
  assert.equal(segments.some((segment) => segment.text === "asset-1"), false);

  const translations = new Map(segments.map((segment) => [segment.key, `译:${segment.text}`]));
  const result = buildDoubaoTranslationResult(document, translations);
  assert.equal(result.output.product.title, "译:SPC flooring");
  assert.equal(result.output.media[0]?.id, "asset-1");
  assert.equal(result.output.media[0]?.caption, "");
  assert.equal(result.output.specifications[0]?.id, "spec-1");
});

test("preserves overlong SEO output for rewrite or QA instead of truncating it", () => {
  const document = parseDoubaoTranslationDocument(sourceJson);
  const translations = new Map([["product.seoTitle", "x".repeat(90)]]);
  const result = buildDoubaoTranslationResult(document, translations);
  assert.equal(result.output.product.seoTitle.length, 90);
  assert.ok(result.warnings.some((warning) => warning.includes("product.seoTitle")));
});

test("detects only the dedicated Doubao translation model family", () => {
  assert.equal(isDoubaoTranslationModel("doubao-seed-translation-250915"), true);
  assert.equal(isDoubaoTranslationModel("doubao-seed-2-0-lite-260215"), false);
});

test("builds the dedicated Responses API translation contract", () => {
  const body = buildDoubaoTranslationRequestBody({
    model: "doubao-seed-translation-250915",
    text: "SPC flooring",
    sourceLanguage: "en",
    targetLanguage: "de",
    maxOutputTokens: 12000,
  });
  assert.deepEqual(body.input[0]?.content[0]?.translation_options, {
    source_language: "en",
    target_language: "de",
  });
  assert.equal(body.input[0]?.content[0]?.text, "SPC flooring");
  assert.equal(body.max_output_tokens, 3000);
});

test("passes retry feedback as server-side instructions", () => {
  const body = buildDoubaoTranslationRequestBody({
    model: "doubao-seed-translation-250915",
    text: "[[TERM_0]] flooring",
    sourceLanguage: "en",
    targetLanguage: "ar",
    maxOutputTokens: 12000,
    instructions: "Copy [[TERM_0]] exactly.",
  });
  assert.equal(body.instructions, "Copy [[TERM_0]] exactly.");
});

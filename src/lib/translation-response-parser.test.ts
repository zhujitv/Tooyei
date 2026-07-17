import assert from "node:assert/strict";
import test from "node:test";

import {
  extractJsonObjectCandidates,
  normalizeTranslationCoreFields,
  parseTranslationResponse,
  TranslationResponseParseError,
} from "./translation-response-parser";

const valid = {
  title: "Title",
  summary: "Summary",
  seoTitle: "SEO",
  seoDescription: "Description",
  content: "<p>Body</p>",
};

test("parses a valid JSON response", () => {
  assert.deepEqual(parseTranslationResponse(JSON.stringify(valid)), valid);
});

test("parses a fenced JSON response", () => {
  assert.deepEqual(parseTranslationResponse(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``), valid);
});

test("extracts JSON after a Markdown heading", () => {
  assert.deepEqual(parseTranslationResponse(`### SEO Title\n${JSON.stringify(valid)}`), valid);
});

test("balanced extraction handles nested and escaped braces", () => {
  const source = 'prefix {"content":"<div>{value} \\\"quoted\\\"</div>","nested":{"ok":true}} suffix';
  assert.equal(extractJsonObjectCandidates(source)[0], '{"content":"<div>{value} \\\"quoted\\\"</div>","nested":{"ok":true}}');
  assert.equal(parseTranslationResponse(source).content, '<div>{value} "quoted"</div>');
});

test("normalizes snake_case aliases and description", () => {
  const { output, warnings } = normalizeTranslationCoreFields({
    title: "T",
    description: "S",
    seo_title: "ST",
    seo_description: "SD",
    body: "B",
  });
  assert.deepEqual(output, { title: "T", summary: "S", seoTitle: "ST", seoDescription: "SD", content: "B" });
  assert.deepEqual(warnings, []);
});

test("missing fields become empty strings and produce warnings", () => {
  const { output, warnings } = normalizeTranslationCoreFields({ summary: "Only summary" });
  assert.equal(output.title, "");
  assert.equal(output.summary, "Only summary");
  assert.ok(warnings.some((warning) => warning.includes("title")));
});

test("throws a recognizable error for unparseable text", () => {
  assert.throws(
    () => parseTranslationResponse("### SEO Title\nnot json"),
    (error) => error instanceof TranslationResponseParseError && error.errorType === "RESPONSE_PARSE",
  );
});

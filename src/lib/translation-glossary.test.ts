import assert from "node:assert/strict";
import test from "node:test";

import { Locale } from "@/generated/prisma/client";
import { buildBuildingMaterialsGlossaryPrompt } from "./translation-glossary";

test("adds only matching building-material terms for the target language", () => {
  const prompt = buildBuildingMaterialsGlossaryPrompt(
    JSON.stringify({ title: "SPC flooring with wear layer and click lock" }),
    Locale.DE,
  );

  assert.match(prompt, /SPC => preserve exactly/);
  assert.match(prompt, /wear layer => Nutzschicht/);
  assert.match(prompt, /click lock => Klicksystem/);
  assert.doesNotMatch(prompt, /underlay/);
});

test("omits the glossary instruction when the content has no known term", () => {
  assert.equal(buildBuildingMaterialsGlossaryPrompt('{"title":"Oak collection"}', Locale.JA), "");
});

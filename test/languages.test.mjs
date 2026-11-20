import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, DEFAULT_PAIR, findLanguage } from "../languages.js";

test("default pair is English and Hindi", () => {
  assert.deepEqual(DEFAULT_PAIR, ["hi", "en"]);
  assert.equal(findLanguage("en").speech, "en-US");
  assert.equal(findLanguage("hi").speech, "hi-IN");
});

test("language codes are unique and every entry has a speech tag", () => {
  const codes = LANGUAGES.map((l) => l.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const l of LANGUAGES) {
    assert.ok(l.name && /^[a-z]{2,3}(-[A-Za-z]{2,4})?-[A-Z]{2}$|^[a-z]{2,3}-[A-Z]{2}$/.test(l.speech) || /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(l.speech), `bad speech tag ${l.speech}`);
  }
});

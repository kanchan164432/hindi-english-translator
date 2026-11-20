import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGoogle, translateGoogle, translateMyMemory, translateWithFallback, clampText, MAX_CHARS } from "../translate.js";

const okJson = (body) => ({ ok: true, status: 200, json: async () => body });

test("parses Google gtx response, joining segments", () => {
  const data = [[["नमस्ते, ", "Hello, "], ["आप कैसे हैं", "how are you"]], null, "en"];
  assert.equal(parseGoogle(data), "नमस्ते, आप कैसे हैं");
});

test("rejects malformed Google response", () => {
  assert.throws(() => parseGoogle({ foo: 1 }), /Unexpected Google response/);
});

test("clampText rejects empty and too long input", () => {
  assert.throws(() => clampText("   "), /Nothing to translate/);
  assert.throws(() => clampText("a".repeat(MAX_CHARS + 1)), /too long/);
  assert.equal(clampText("  hi  "), "hi");
});

test("translateGoogle builds a correct URL and returns text", async () => {
  let seen;
  const fake = async (url) => { seen = url; return okJson([[["नमस्ते", "Hello"]]]); };
  const out = await translateGoogle("Hello", "en", "hi", fake);
  assert.equal(out, "नमस्ते");
  assert.match(seen, /sl=en&tl=hi/);
  assert.match(seen, /q=Hello/);
});

test("translateMyMemory reads responseData", async () => {
  const fake = async () => okJson({ responseStatus: 200, responseData: { translatedText: "नमस्ते" } });
  assert.equal(await translateMyMemory("Hello", "en", "hi", fake), "नमस्ते");
});

test("fallback uses MyMemory when Google fails", async () => {
  const fake = async (url) => {
    if (url.includes("googleapis")) return { ok: false, status: 429, json: async () => ({}) };
    return okJson({ responseStatus: 200, responseData: { translatedText: "नमस्ते" } });
  };
  const r = await translateWithFallback("Hello", "en", "hi", "google", fake);
  assert.deepEqual(r, { text: "नमस्ते", provider: "mymemory" });
});

test("fallback reports every failure when all providers fail", async () => {
  const fake = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(translateWithFallback("Hello", "en", "hi", "google", fake), /All free translators failed/);
});

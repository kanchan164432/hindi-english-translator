// Free translation providers. No API key, no paid account.
//
// - "google" : the same endpoint translate.google.com uses (unofficial, free, usually best quality)
// - "mymemory": MyMemory public API (free, daily limit, lower quality; used as a fallback)
//
// Both are called straight from the browser; both send Access-Control-Allow-Origin: *.
// Google's endpoint is unofficial, so it can change or rate-limit. That is why a fallback exists.

export const MAX_CHARS = 450; // keep requests small (MyMemory free tier limit is about 500 bytes)

// Language codes are letters, optionally with a region (e.g. "en", "zh-CN"). Anything else is rejected
// so it can't alter the request URL.
const CODE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export function checkCodes(from, to) {
  if (!CODE.test(from) || !CODE.test(to)) throw new Error(`Unsupported language code: ${from} → ${to}`);
  if (from === to) throw new Error("Pick two different languages.");
}

export function clampText(text) {
  const t = String(text || "").trim();
  if (!t) throw new Error("Nothing to translate.");
  if (t.length > MAX_CHARS) throw new Error(`Text too long (max ${MAX_CHARS} characters).`);
  return t;
}

// Parses the Google gtx response: [[["translated","original",...], ...], ...]
export function parseGoogle(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("Unexpected Google response.");
  return data[0].map((seg) => (seg && seg[0]) || "").join("").trim();
}

export async function translateGoogle(text, from, to, fetchImpl = fetch) {
  const q = clampText(text);
  checkCodes(from, to);
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t" +
    `&sl=${from}&tl=${to}&q=${encodeURIComponent(q)}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Google translate failed (HTTP ${res.status}).`);
  return parseGoogle(await res.json());
}

export async function translateMyMemory(text, from, to, fetchImpl = fetch) {
  const q = clampText(text);
  checkCodes(from, to);
  const url =
    "https://api.mymemory.translated.net/get?" +
    `q=${encodeURIComponent(q)}&langpair=${from}|${to}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`MyMemory failed (HTTP ${res.status}).`);
  const data = await res.json();
  if (data.responseStatus !== 200 && data.responseStatus !== "200") {
    throw new Error(`MyMemory: ${data.responseDetails || "error"}`);
  }
  const out = data.responseData && data.responseData.translatedText;
  if (!out) throw new Error("MyMemory returned no text.");
  return out.trim();
}

const PROVIDERS = {
  google: translateGoogle,
  mymemory: translateMyMemory,
};

// Tries the preferred provider first, then the others. Returns { text, provider }.
export async function translateWithFallback(text, from, to, preferred = "google", fetchImpl = fetch) {
  const order = [preferred, ...Object.keys(PROVIDERS).filter((p) => p !== preferred)];
  const errors = [];
  for (const name of order) {
    try {
      const text_out = await PROVIDERS[name](text, from, to, fetchImpl);
      if (text_out) return { text: text_out, provider: name };
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error("All free translators failed. " + errors.join(" | "));
}

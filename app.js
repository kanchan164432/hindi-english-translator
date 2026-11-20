import { translateWithFallback } from "./translate.js";
import { LANGUAGES, DEFAULT_PAIR, findLanguage } from "./languages.js";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const $ = (id) => document.getElementById(id);

const els = {
  talkA: $("talkA"), talkB: $("talkB"), status: $("status"), live: $("live"),
  typedForm: $("typedForm"), typedText: $("typedText"), typedDir: $("typedDir"),
  autoSpeak: $("autoSpeak"), log: $("log"), clear: $("clear"),
  menuBtn: $("menuBtn"), menu: $("menu"), langA: $("langA"), langB: $("langB"),
  swap: $("swap"), resetLangs: $("resetLangs"),
};

const HISTORY_KEY = "translator.history.v1";
const PAIR_KEY = "translator.pair.v1";

// The two languages in use. "a" and "b" are the two sides of the conversation.
let pair = loadPair();
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
let recognizer = null;

function loadPair() {
  try {
    const saved = JSON.parse(localStorage.getItem(PAIR_KEY) || "null");
    if (Array.isArray(saved) && saved.length === 2 && saved.every(findLanguage) && saved[0] !== saved[1]) return saved;
  } catch (_) { /* fall through to default */ }
  return [...DEFAULT_PAIR];
}

const langName = (code) => (findLanguage(code) || { name: code }).name;
const speechTag = (code) => (findLanguage(code) || { speech: code }).speech;
const otherSide = (side) => (side === "a" ? "b" : "a");

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function pickVoice(code) {
  const want = speechTag(code).toLowerCase();
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase())) ||
    null
  );
}

function speak(text, code) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = speechTag(code);
  const voice = pickVoice(code);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

// Button labels, typed-direction options and the menu all follow the chosen pair.
function renderPair() {
  const [a, b] = pair;
  els.talkA.innerHTML = `🎤 Speak ${langName(a)}<br><small>→ ${langName(b)}</small>`;
  els.talkB.innerHTML = `🎤 Speak ${langName(b)}<br><small>→ ${langName(a)}</small>`;
  els.typedDir.innerHTML = "";
  els.typedDir.append(new Option(`${a} → ${b}`, "a"), new Option(`${b} → ${a}`, "b"));
  els.langA.value = a;
  els.langB.value = b;
}

function renderLog() {
  els.log.innerHTML = "";
  // Newest first: history is stored oldest-first, so render it reversed.
  for (const item of [...history].reverse()) {
    const li = document.createElement("li");
    const src = document.createElement("div");
    src.className = "src";
    src.textContent = item.source;
    const dst = document.createElement("div");
    dst.className = "dst";
    dst.textContent = item.translated;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.from} → ${item.to} · ${item.provider} · ${new Date(item.at).toLocaleTimeString()}`;
    const replay = document.createElement("button");
    replay.className = "replay";
    replay.textContent = "🔊 Replay";
    replay.addEventListener("click", () => speak(item.translated, item.to));
    meta.appendChild(replay);
    li.append(src, dst, meta);
    els.log.appendChild(li);
  }
}

function saveHistory() {
  history = history.slice(-50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

async function handleUtterance(text, from, to) {
  setStatus("Translating…");
  try {
    const { text: translated, provider } = await translateWithFallback(text, from, to, "google");
    history.push({ source: text, translated, from, to, provider, at: Date.now() });
    saveHistory();
    renderLog();
    els.live.textContent = translated;
    setStatus("Done. Tap a button to continue.");
    if (els.autoSpeak.checked) speak(translated, to);
  } catch (err) {
    setStatus(err.message, true);
  }
}

function setBusy(side) {
  els.talkA.classList.toggle("listening", side === "a");
  els.talkB.classList.toggle("listening", side === "b");
  els.talkA.disabled = side === "b";
  els.talkB.disabled = side === "a";
}

// side is "a" or "b": which language the speaker is using.
function startListening(side) {
  if (!SR) {
    setStatus("This browser has no speech recognition. Use Chrome or Edge.", true);
    return;
  }
  if (recognizer) { recognizer.stop(); return; }

  const from = pair[side === "a" ? 0 : 1];
  const to = pair[side === "a" ? 1 : 0];

  recognizer = new SR();
  recognizer.lang = speechTag(from);
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.maxAlternatives = 1;
  let finalText = "";

  recognizer.onstart = () => {
    setBusy(side);
    setStatus(`Listening in ${langName(from)}… tap again to stop.`);
    els.live.textContent = "";
  };
  recognizer.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    els.live.textContent = (finalText + interim).trim();
  };
  recognizer.onerror = (event) => {
    const msg = {
      "not-allowed": "Microphone permission was denied. Allow the mic for this site.",
      "no-speech": "I did not hear anything. Try again.",
      "audio-capture": "No microphone found.",
      "language-not-supported": `Your phone or browser cannot listen in ${langName(from)}.`,
      network: "Speech service unreachable. Check your internet connection.",
    }[event.error] || `Speech error: ${event.error}`;
    setStatus(msg, true);
  };
  recognizer.onend = () => {
    const text = finalText.trim();
    recognizer = null;
    setBusy(null);
    if (text) handleUtterance(text, from, to);
    else if (!els.status.classList.contains("error")) setStatus("Nothing recognized. Try again.");
  };

  try {
    recognizer.start();
  } catch (err) {
    recognizer = null;
    setStatus("Could not start the microphone: " + err.message, true);
  }
}

// Changing the languages: two different languages, saved for next time.
function setPair(a, b) {
  if (a === b) {
    setStatus("Pick two different languages.", true);
    renderPair();
    return;
  }
  pair = [a, b];
  localStorage.setItem(PAIR_KEY, JSON.stringify(pair));
  renderPair();
  setStatus(`Now translating ${langName(a)} ↔ ${langName(b)}.`);
}

// Menu: a hamburger button toggles the language panel.
function setMenu(open) {
  els.menu.hidden = !open;
  els.menuBtn.setAttribute("aria-expanded", String(open));
}

for (const lang of LANGUAGES) {
  els.langA.add(new Option(lang.name, lang.code));
  els.langB.add(new Option(lang.name, lang.code));
}

// A tap starts listening, or stops it if this side is already listening (the other side is disabled then).
els.talkA.addEventListener("click", () => startListening("a"));
els.talkB.addEventListener("click", () => startListening("b"));

els.typedForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.typedText.value.trim();
  if (!text) return;
  const [from, to] = els.typedDir.value === "a" ? [pair[0], pair[1]] : [pair[1], pair[0]];
  handleUtterance(text, from, to);
  els.typedText.value = "";
});

els.menuBtn.addEventListener("click", () => setMenu(els.menu.hidden));
els.langA.addEventListener("change", () => setPair(els.langA.value, pair[1]));
els.langB.addEventListener("change", () => setPair(pair[0], els.langB.value));
els.swap.addEventListener("click", () => setPair(pair[1], pair[0]));
els.resetLangs.addEventListener("click", () => setPair(...DEFAULT_PAIR));

els.clear.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderLog();
  els.live.textContent = "";
});

renderPair();
renderLog();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

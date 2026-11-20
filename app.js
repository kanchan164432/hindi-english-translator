import { translateWithFallback } from "./translate.js";

// Speech recognition / synthesis language tags for each side.
const SPEECH = { en: "en-US", hi: "hi-IN" };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const $ = (id) => document.getElementById(id);
const els = {
  talkHi: $("talkHi"), talkEn: $("talkEn"), status: $("status"), live: $("live"),
  typedForm: $("typedForm"), typedText: $("typedText"), typedDir: $("typedDir"),
  autoSpeak: $("autoSpeak"), log: $("log"), clear: $("clear"),
};

const HISTORY_KEY = "translator.history.v1";
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
let recognizer = null;
let activeFrom = null; // "hi" or "en" while listening

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function pickVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const want = SPEECH[lang].toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
    null
  );
}

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH[lang];
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

function renderLog() {
  els.log.innerHTML = "";
  for (const item of history) {
    const li = document.createElement("li");
    const src = document.createElement("div");
    src.className = "src";
    src.textContent = item.source;
    const dst = document.createElement("div");
    dst.className = "dst";
    dst.textContent = item.translated;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.from.toUpperCase()} → ${item.to.toUpperCase()} · ${item.provider} · ${new Date(item.at).toLocaleTimeString()}`;
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

async function handleUtterance(text, from) {
  const to = from === "hi" ? "en" : "hi";
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

function setBusy(listeningFrom) {
  els.talkHi.classList.toggle("listening", listeningFrom === "hi");
  els.talkEn.classList.toggle("listening", listeningFrom === "en");
  els.talkHi.disabled = listeningFrom === "en";
  els.talkEn.disabled = listeningFrom === "hi";
}

function startListening(from) {
  if (!SR) {
    setStatus("This browser has no speech recognition. Use Chrome or Edge.", true);
    return;
  }
  if (recognizer) { recognizer.stop(); return; }

  recognizer = new SR();
  recognizer.lang = SPEECH[from];
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.maxAlternatives = 1;
  activeFrom = from;
  let finalText = "";

  recognizer.onstart = () => {
    setBusy(from);
    setStatus(from === "hi" ? "Listening in Hindi… tap again to stop." : "Listening in English… tap again to stop.");
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
      network: "Speech service unreachable. Check your internet connection.",
    }[event.error] || `Speech error: ${event.error}`;
    setStatus(msg, true);
  };
  recognizer.onend = () => {
    const text = finalText.trim();
    recognizer = null;
    setBusy(null);
    activeFrom = null;
    if (text) handleUtterance(text, from);
    else if (!els.status.classList.contains("error")) setStatus("Nothing recognized. Try again.");
  };

  try {
    recognizer.start();
  } catch (err) {
    recognizer = null;
    setStatus("Could not start the microphone: " + err.message, true);
  }
}

els.talkHi.addEventListener("click", () => (activeFrom === "hi" || !activeFrom ? startListening("hi") : null));
els.talkEn.addEventListener("click", () => (activeFrom === "en" || !activeFrom ? startListening("en") : null));

els.typedForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.typedText.value.trim();
  if (!text) return;
  const [from] = els.typedDir.value.split("-");
  handleUtterance(text, from);
  els.typedText.value = "";
});

els.clear.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderLog();
  els.live.textContent = "";
});

if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};
renderLog();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

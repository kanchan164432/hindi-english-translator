// Languages the app can speak and translate. `code` is used for translation (Google and MyMemory
// accept these codes), `speech` is the BCP-47 tag used for speech recognition and voices.
// Speech only works if the browser/phone has that language installed, and translation quality varies.

export const LANGUAGES = [
  { code: "en", name: "English", speech: "en-US" },
  { code: "hi", name: "हिन्दी (Hindi)", speech: "hi-IN" },
  { code: "es", name: "Español (Spanish)", speech: "es-ES" },
  { code: "fr", name: "Français (French)", speech: "fr-FR" },
  { code: "de", name: "Deutsch (German)", speech: "de-DE" },
  { code: "it", name: "Italiano (Italian)", speech: "it-IT" },
  { code: "pt", name: "Português (Portuguese)", speech: "pt-BR" },
  { code: "ru", name: "Русский (Russian)", speech: "ru-RU" },
  { code: "ar", name: "العربية (Arabic)", speech: "ar-SA" },
  { code: "fa", name: "فارسی (Persian)", speech: "fa-IR" },
  { code: "he", name: "עברית (Hebrew)", speech: "he-IL" },
  { code: "tr", name: "Türkçe (Turkish)", speech: "tr-TR" },
  { code: "zh-CN", name: "中文 (Chinese)", speech: "zh-CN" },
  { code: "ja", name: "日本語 (Japanese)", speech: "ja-JP" },
  { code: "ko", name: "한국어 (Korean)", speech: "ko-KR" },
  { code: "vi", name: "Tiếng Việt (Vietnamese)", speech: "vi-VN" },
  { code: "th", name: "ไทย (Thai)", speech: "th-TH" },
  { code: "id", name: "Bahasa Indonesia", speech: "id-ID" },
  { code: "nl", name: "Nederlands (Dutch)", speech: "nl-NL" },
  { code: "pl", name: "Polski (Polish)", speech: "pl-PL" },
  { code: "sw", name: "Kiswahili (Swahili)", speech: "sw-KE" },
  { code: "bn", name: "বাংলা (Bengali)", speech: "bn-IN" },
  { code: "ta", name: "தமிழ் (Tamil)", speech: "ta-IN" },
  { code: "te", name: "తెలుగు (Telugu)", speech: "te-IN" },
  { code: "mr", name: "मराठी (Marathi)", speech: "mr-IN" },
  { code: "gu", name: "ગુજરાતી (Gujarati)", speech: "gu-IN" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", speech: "pa-IN" },
  { code: "ur", name: "اردو (Urdu)", speech: "ur-PK" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)", speech: "kn-IN" },
  { code: "ml", name: "മലയാളം (Malayalam)", speech: "ml-IN" },
  { code: "tl", name: "Filipino (Tagalog)", speech: "fil-PH" },
];

export const DEFAULT_PAIR = ["en", "hi"];

export function findLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || null;
}

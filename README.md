# Hindi ↔ English Translator (free)

A static web app (installable on Android) that listens in Hindi or English, translates it, shows the text, and speaks the result.
No paid API keys, no server costs.

## What is free

| Part | Used | Cost |
|---|---|---|
| Speech to text | Browser Web Speech API (Chrome/Edge) | Free |
| Translation | Google Translate web endpoint, MyMemory as backup | Free, no key |
| Text to speech | Browser speechSynthesis (Hindi and English voices) | Free |
| Hosting | Any static host or your domain | Free or near free |

## Run it on your computer

```bash
cd Language
npm test          # unit tests for the translator
npm start         # serves http://localhost:8080
```

Open http://localhost:8080 in Chrome. Microphone access works on localhost.

## Put it on your domain (HTTPS is required for the mic)

Upload these files to any static host (your domain's web root, GitHub Pages, Netlify, Cloudflare Pages):

`index.html`, `app.js`, `translate.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`

Then open the site on your Android phone in Chrome and choose **Add to Home screen**. It opens full screen like an app.

## Caveats

- The Google endpoint is unofficial. It works today but Google can change or limit it. The app falls back to MyMemory automatically. MyMemory's quality is lower.
- Speech recognition needs internet and Chrome/Edge. It sends audio to Google.
- Phone calls cannot be captured by a web app on Android. Use speakerphone and hold the phone near the speaker.
- Not for medical, legal, bank, or immigration conversations without a human interpreter.

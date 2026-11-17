# YouTube to PDF

Paste a YouTube link, get everything said in the video as a PDF.

Live: https://youtube-text-to-pdf.netlify.app

It reads the video's captions (human-written or auto-generated), shows them on the page, and builds the PDF in your browser. Videos with no captions have no text to extract.

Made for phones, tablets and computers:

- **Paste** button next to the link box, and pasting a link starts right away
- Big buttons, with **Copy** and **Download PDF** always at the bottom of the screen
- **Share** button on phones and tablets to send the PDF to another app (Files, Drive, mail, chat)
- Clickable **timestamps** that open the video at that moment
- Light and dark mode follow your device
- **Add to home screen** and it opens like an app. On Android it then shows up in YouTube's Share menu, so you can send a video straight to it
- Links like `/?v=VIDEO_ID` open straight to that video's text, so you can bookmark or share them

## Run it on your computer

Needs [Node.js](https://nodejs.org) 18 or newer. Nothing to install.

```bash
npm start
```

Then open http://localhost:3000.

## Put it online

The repo is set up for Netlify: `public/` is the site and `netlify/functions/transcript.mjs` serves `/api/transcript`. Connect the repo in Netlify and it deploys as is.

YouTube sometimes refuses caption requests that come from hosting providers. When that happens the site says so; running it on your own computer avoids the problem.

## How it's laid out

| File | Job |
| --- | --- |
| `public/index.html` | The page: link box, preview, PDF download |
| `public/manifest.webmanifest`, `public/sw.js`, icons | Home-screen app, share menu, offline start |
| `lib/youtube.mjs` | Reads a video's captions from YouTube |
| `netlify/functions/transcript.mjs` | The hosted `/api/transcript` endpoint |
| `server.mjs` | The same endpoint plus the page, for local use |
| `test/` | `npm test` |

Text in alphabets the built-in PDF fonts can't draw (anything beyond Western European letters) is saved through the browser's own "Save as PDF" print window instead.

Only save text you have the right to use.

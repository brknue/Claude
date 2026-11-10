# Verity · Follow the evidence

A multilingual evidence-first fact-checking app. English, German and Turkish interfaces; reports follow the selected language.

## Status

The website and server are implemented. **Live AI research requires an OpenAI API key in the hosted server environment. Until configured, the app clearly reports `setup_required` and never generates a verdict or score.** Live external-provider requests have not been tested with a real key. Automated tests use controlled mock provider responses, not actual fact checks.

## What it does

- Accepts a public HTTPS link, pasted post/article text, a transcript, or an uploaded recording.
- Reads ordinary public article/forum bodies through Jina Reader, a third-party public reader. Link access is not universal. It does not log into apps or bypass restrictions.
- For major video/social platforms, requires the exact pasted post/captions/transcript or a recording instead of treating page titles as video evidence.
- Accepts MP3, MP4, M4A, MPEG, WAV and WEBM up to 20 MB. OpenAI transcribes speech. For browser-decodable videos, up to six evenly spaced frames are sampled. The rest of the video, provenance, editing and authenticity are not verified. Silent videos without a useful transcript are rejected.
- Uses Responses API web search to research up to eight central factual claims, then generates a structured report. Sources are collected from actual search results/citation metadata. Report source IDs are checked against that list.
- Displays a claim-by-claim explanation, original source links, missing context, uncertainty, and scoring coverage. Source presence alone does not prove the model interpreted it correctly.
- Saves reports only on explicit request in browser localStorage (up to 12). Includes plain-text download and print/PDF. History may be visible to other users of the same browser.

## Scoring

1–100 measures assessed **evidence support**, not a calibrated truth probability:

| Score | Meaning |
| --- | --- |
| 1–20 | Contradicted by retrieved evidence |
| 21–79 | Mixed, partial, or missing essential context |
| 80–100 | Supported by retrieved evidence |
| Unscored | Evidence cannot settle the claim |

Overall score is the rounded equal-weight mean of scored claims. Coverage (`scored/total identified claims`) is always displayed. Unverifiable claims are excluded from the mean. A high average with low coverage is not a strong overall conclusion. The app cannot guarantee exhaustive claim extraction or reliable answers for all subjects.

## Development

Node.js 22 or later, no npm dependencies:

```sh
npm test
npm run build
npm run dev
```

The build bundles HTML, CSS and browser JavaScript into a Cloudflare Worker at `dist/server/index.js`. `dev.mjs` serves local assets and API routes. For local live testing, configure environment variables outside source control and explicitly set `ALLOW_LOCAL_DEV=1`; this bypass is only for a trusted local environment. Never enable it on a public server.

## Hosted configuration

Set the server secret `OPENAI_API_KEY`. Optional `OPENAI_MODEL` (default `gpt-4.1`) and `OPENAI_TRANSCRIBE_MODEL` (default `gpt-4o-mini-transcribe`). These defaults are configurable and may need adjustment for account model access. Keys stay server-side; never put them in browser code, GitHub, HTML, or `.openai/hosting.json`.

The Sites project is private to the owner. Live check requests require the trusted platform identity header `oai-authenticated-user-id`; on other hosting, replace this with real server-verified authentication. Do not trust this header on an unprotected, directly accessible server. Cross-origin API calls are rejected. Isolate-local concurrency protection is best effort, not a durable quota. Keep owner-only access; before broader sharing, add durable per-user quotas and usage billing controls.

`.openai/hosting.json` preserves the existing Sites identity. GitHub Pages can host the browser files, but cannot run the API backend; deploy the Worker for real research. The GitHub copy is source code, not a claim of live research activation.

## Security and privacy

- Submitted text and media go to OpenAI. Links and retrieved public content go through Jina Reader. OpenAI Responses calls set `store:false`, which does not override provider retention policies.
- Content is not persisted by this application server. Hosting/provider logs and browser history may have their own retention.
- User URLs are restricted to public-looking HTTPS domains; credentials, IP literals, custom ports and local names are rejected. The Worker only fetches the fixed reader/provider endpoints, not arbitrary user hosts directly.
- Page, upload and text sizes are capped. Extracted body text is limited to 30,000 characters and truncation is disclosed.
- Submitted text, webpages and frames are treated as untrusted data in research instructions. Prompt injection resistance is not guaranteed.
- Provider/user content is rendered using text nodes; sources must be HTTPS links. Content Security Policy blocks external scripts.
- A missing source, failed provider request, invalid report or insufficient evidence does not produce a fabricated score.

## Verification

Automated coverage includes URL validation, source extraction failures, source deduplication, invented reference rejection, unscored claims, aggregate score coverage, search-to-report wiring, provider source failures, missing credentials, authentication, cross-origin rejection, and video-link fallback. Live OpenAI responses, transcription quality, and accessibility of arbitrary external pages need real-world verification after account activation.

## API documentation

- https://developers.openai.com/api/docs/guides/tools-web-search
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/speech-to-text

AI assessments and sources can be wrong. Open original sources before relying on a result.

# Fluent Path

A language-learning website that runs entirely in the browser: a daily plan, short lessons, spaced repetition and
saved progress. Spanish, French, German, Italian, Portuguese (Brazil) and English, each learnable from any of the others.

## Run it

No build step and no dependencies. Serve the folder with any static server and open it:

```bash
python -m http.server 8765
```

Then open `http://localhost:8765`. After the first visit it works with no connection.

## What it does

- **First visit:** asks which languages you speak (level, and whether you write them), which you want to learn,
  how many minutes a day (10 is the minimum), and whether you want speaking only or speaking and writing.
- **Plan:** dated phases for the course, plus an honest estimate of how far fluency is at your pace.
- **Lessons:** new items in groups of three, then recognition, sentence building, typing or dictation, and saying
  answers aloud. Missed items return in the same lesson and the next day.
- **Reviews:** each item comes back after 1, 3, 7, 16, 37 … days.
- **Progress:** saved in this browser after every answer. A lesson can be paused and resumed. Backups can be
  downloaded and restored from Settings.

## Offline and private

- All learning material is in `data/`. Nothing is fetched from anywhere else, and the page's content security policy
  blocks connections to other sites.
- A service worker caches the site so it opens without a connection.
- Audio uses only voices installed on the device. If the device has no voice for a language, lessons run without
  sound and the site explains how to add one.

## Files

| Path | Contents |
|------|----------|
| `data/*.js` | The library: 20 units of 14 words and 9 sentences per language, grammar notes, sound guides |
| `js/engine.js` | Answer checking, scheduling, session building, planning, storage |
| `js/app.js` | Every screen |
| `tests.mjs` | Library checks, engine tests and simulated learners: `node tests.mjs` |
| `REVIEWS.md` | The 22 reviews of the learning experience and what each changed |

## Limits

The course is a beginner foundation (460 items per language), speaking is self-graded, the interface is in English,
and the translations have not been checked by native speakers.

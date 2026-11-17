# Fluent Path

A language-learning website that runs entirely in the browser: a daily plan, short lessons, spaced repetition and
saved progress. Spanish, French, German, Italian, Portuguese (Brazil) and English, each learnable from any of the others.
Works on phones (from 320 px wide, upright or sideways), tablets and desktops, with touch, mouse or keyboard.

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
| `data/*.js` | The core library: 20 units of 14 words and 9 sentences per language, grammar notes, sound guides |
| `data/tatoeba/` | 3,000 more sentences per language in 149 units (three levels, grouped by topic), from Tatoeba |
| `tools/build_tatoeba.py` | Rebuilds `data/tatoeba/` from the Tatoeba exports |
| `js/engine.js` | Answer checking, scheduling, session building, planning, storage |
| `js/app.js` | Every screen |
| `tests.mjs` | Library checks, engine tests and simulated learners: `node tests.mjs` |
| `REVIEWS.md` | The 22 reviews of the learning experience and what each changed |

## The library

- **Units 1–20** (460 items per language) were written for Fluent Path: core words and sentences with grammar notes.
- **Units 21–169** (3,000 sentences per language) come from [Tatoeba](https://tatoeba.org), a volunteer collection of
  sentences and translations, licensed [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). Only English
  sentences that Tatoeba has translated into all five other languages were used, so every item means the same thing in
  every language. Sentences with names, digits or unsuitable topics were left out, each language keeps up to three
  accepted translations, and the units run from short, common sentences to longer, richer ones.
  `data/tatoeba/SOURCES.tsv` lists the Tatoeba sentence number behind every item in every language.

To rebuild it, download `eng_sentences.tsv`, `spa/fra/deu/ita/por_sentences.tsv` and `eng-spa/fra/deu/ita/por_links.tsv`
from Tatoeba's per-language exports into one folder, then run `python tools/build_tatoeba.py <that folder> . --write`.

## Limits

Speaking is self-graded and the interface is in English. The core units were written by the builder and the Tatoeba
translations by volunteers; neither has been checked by a native-speaker reviewer for this course. Tatoeba's Portuguese
mixes Brazilian and European usage; obvious European-only words were filtered out.

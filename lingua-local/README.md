# Lingua Local

[Open the website](https://brknue.github.io/Claude/lingua-local/)

Open `index.html` directly in a browser for offline use. No build or account is required. Interface and teaching notes are in English.

## Library

Six languages: English, German, Turkish, Spanish, French and Italian.

- Original 48 expressions and eight conversation units preserved with stable IDs.
- Added 207 core-word entries per language from Wiktionary-derived Swadesh lists: 255 entries per language, 1,530 language entries overall.
- 31 practice packs, searchable by either language, topic and collection.
- Practice a single entry or up to 12 filtered results; paginate the library 24 entries at a time.
- German/French IPA where available; multiple listed alternatives accepted for vocabulary answers.

Data sources, licensing and corrections: [SOURCES.md](SOURCES.md). Adapted vocabulary: CC BY-SA 4.0. `core-vocabulary.json` includes provenance and the 26-entry correction log; `upstream-swadesh.json` preserves imported data.

## Learning

Learner profiles, known languages/levels/literacy, multiple targets, 15–60 minute plans, speaking-only or writing mode, self-assessed recall, spaced review, saved sessions, local progress and JSON backup/restore. No analytics, cloud speech or remote learning API. Optional audio uses installed local device voices only.

The added vocabulary is a core-concept reference, not a graded CEFR curriculum. No automated pronunciation scoring, certified placement or guarantee of fluency. Speaking is self-assessed. Context, gender and conjugation still need study.

## Offline use

All learning data is embedded in index.html. Settings → Download offline page exports a self-contained copy. Hosted HTTPS use also installs a service worker. On an existing installation, reload after the worker update to see the expanded library. Browser storage on file URLs varies; keep exported backups. Progress is neither encrypted nor shared across devices.

## Verification

Original report: QA.md. Expansion checks and observed browser results: QA-library-expansion.md.

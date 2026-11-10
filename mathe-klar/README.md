# Mathe klar · Realschule 5–10

German-language visual mathematics course with 77 lessons, 399 scenes and 77 practice questions. Topics are organized into six grades and four subject areas. Curriculum selection is informed by the [NRW Realschule mathematics curriculum (2022)](https://lehrplannavigator.nrw.de/system/files/media/document/file/rs_m_klp_2022_06_17.pdf). Grade placement is an editorial learning sequence; schools may order topics differently.

## Features

- Timeline-based SVG explanations with play/pause, previous/next scene, restart, seeking and 0.25×–3× speed.
- Complete written explanation and current formula for every scene.
- Optional German browser speech synthesis. Narration waits at scene boundaries when needed.
- Search across all grades, subject filtering and deep links to individual lessons.
- Practice questions with worked answers; decimal commas and equivalent fractions are accepted without evaluating user code.
- Browser-local progress; no account or server required.
- Responsive layouts, keyboard navigation, accessible controls and reduced-motion support.
- Fullscreen lesson player and printable explanations.

## Run locally

Serve the static website directory with any HTTP server. For example, from this project:

```sh
python -m http.server 8080 --directory .
```

Open `http://localhost:8080/`. The site does not require a build step or installed dependencies. Google Fonts is optional: system font fallbacks work without network access. Browser speech depends on available voices and browser support.

## Validation

```sh
node tests.mjs
```

The checks validate curriculum records, every scene at three timeline positions (1,197 rendered SVG states), grade coverage and answer equivalence. Browser QA covers navigation, play/pause, speed selection, step selection, search, practice feedback and progress.

## Scope and content

Lessons are original compact introductions with worked examples, rules, caveats and one formative question per topic. They are not a full textbook or a comprehensive exercise bank. They do not guarantee mastery or exhaustive coverage of every school's internal curriculum. Mathematical sketches may be schematic. See the in-app “Lehrplan & Hinweise” panel for details, conventions and the primary source.

## Files

- `index.html`: entry point
- `styles.css`: visual system and responsive layout
- `app.js`: navigation, player, narration and progress
- `curriculum.js`: all lesson content
- `visuals.js`: deterministic timeline-based SVG diagrams
- `answers.js`: restricted numeric/fraction answer parser
- `tests.mjs`: content/rendering and answer tests

No existing repository projects are replaced. This learning site lives in its own `mathe-klar` folder.

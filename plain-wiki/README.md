# Plain Wiki

Paste any Wikipedia link → get the whole article rewritten so anyone can understand it. Same facts, no jargon. Single `index.html`, no build step.

**Features**

- Four simplification levels: Kids (10+), **Everyone (14+)** (default), Curious adult, Light touch
- "No information lost" rules: every fact, number, name and date is kept; hard words are explained in brackets the first time; glossary of all explained words at the bottom
- Output language selector (34 languages) — simplify *and* translate in one go
- Interface in 16 languages (auto-detected, switchable), RTL support for Arabic
- Dark / light mode (follows system, toggle remembered)
- Per-section **Original** toggle, table of contents, font-size control, copy button, stop button
- Section-by-section streaming, so long articles appear progressively

**Running it**

1. **On claude.ai** (published artifact): Claude is built in; the page may ask once for permission to use Claude. Because claude.ai pages can't load wikipedia.org directly, the article is fetched through a TinyFish connector if you have one, otherwise you paste the article text (Ctrl+A, Ctrl+C on the Wikipedia page).
2. **Anywhere else** (GitHub Pages, local file): the article is fetched straight from the Wikipedia API. Open the "API key" box and enter an Anthropic API key — it is stored only in your browser's localStorage and sent directly to `api.anthropic.com`.

Reference / external-link sections are skipped on purpose (they contain only citations). Text from Wikipedia is CC BY-SA.

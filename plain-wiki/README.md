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

**100 % local.** The rewriting is done by an open-weight language model that runs inside your browser on your GPU (via [WebLLM](https://github.com/mlc-ai/web-llm) / WebGPU). Nothing you read or write is sent to any server; the only network traffic is downloading the article from Wikipedia and the model weights once (then cached by the browser).

**Running it**

1. Open the page: <https://brknue.github.io/claude/plain-wiki/> — or download `index.html` and open it in Chrome/Edge (WebGPU needed; Firefox: enable `dom.webgpu.enabled`).
2. Pick a model and click **Download & load model** (Small ≈ 1 GB, Medium ≈ 2 GB, Large ≈ 5 GB / needs 8 GB+ VRAM). This happens once.
3. Paste a Wikipedia link, choose the level, go. If the article can't be loaded (offline), paste its text instead.

Note: the copy embedded on claude.ai cannot download the model or Wikipedia articles (sandbox); use the link above. Reference / external-link sections are skipped on purpose (they contain only citations). Text from Wikipedia is CC BY-SA.

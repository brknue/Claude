# Repo notes for Claude

This repo holds CRB's projects, one folder each. The repo root `index.html` is **plain**, the public project list at https://brknue.github.io/Claude/ (GitHub Pages, branch `main`, root folder, `.nojekyll`).

## "Add <project> to plain"

1. Make sure the project lives in its own root folder with `index.html` + `README.md`, works on phone/tablet/desktop, and loads no third-party fonts or trackers (no Google Fonts: German GDPR rulings). Escape any untrusted text before `innerHTML` — every project shares the `brknue.github.io` origin and its `localStorage` (Fuel Check keeps an API key there).
2. Add an entry at the top of `plain/projects.js` (all 20 languages in `desc`, see `plain/i18n.js` for the codes).
3. `node plain/build.mjs` must print `ok`.
4. Add a line to the root `README.md`.
5. Commit and push to `main`; check the "pages build and deployment" run with `gh api repos/brknue/claude/actions/runs --jq '.workflow_runs[0]'`.

Full details: `plain/README.md`.

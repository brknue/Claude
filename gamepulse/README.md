# GamePulse

Universal game tracker — **not limited to Roblox**.

AAA · Indie · Mobile · Esports · Roblox · any title you search.

## Pages
- `index.html` — main hub
- `track.html?game=slug` — individual tracker (open many browser tabs)
- `catalog.html` — local searchable catalog + “search any game” guidance

## How to cover *all* games in the world

There are 500,000+ commercial games and millions of Roblox experiences. You cannot hardcode every one in static HTML.

### Practical path to near-full coverage

1. **RAWG Video Games Database API** (best starting point)
   - 500,000+ games, 50+ platforms
   - Free: 20,000 requests/month, non-commercial, requires backlink to RAWG on pages that show data
   - Get key: https://rawg.io/apidocs
   - Use for live search + detail pages; keep a small local “featured” list for instant load

2. **IGDB** (Twitch) — free non-commercial (Twitch developer account required)

3. **Steam Web API** — PC / Steam titles

4. **Roblox** — charts / experience APIs and third-party trackers for concurrent players; no single simple “all experiences” feed for static sites

### Recommended architecture
- Local catalog = featured / trending / your favourites (what this repo ships)
- Search box → if not in local list → call RAWG (or open RAWG/Google/Steam search in a new tab)
- Individual tracker pages can later be generated from API responses

This keeps the site fast while still giving a real path to “any game in the world”.

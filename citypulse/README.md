# CityPulse

Tracker for small cities and towns worldwide.

## Pages
- `index.html` — home + featured
- `track.html?city=slug` — individual city tracker (multi-tab friendly)
- `catalog.html` — local searchable catalog + path to full coverage

## How to get *all* cities on the website

There are **millions** of named places (SimpleMaps Comprehensive ≈ 4.4 million; GeoNames is similar in scale). You cannot embed every one in a static HTML page.

### Practical path to near-full coverage

1. **GeoNames** (free, open)
   - Download dumps: https://download.geonames.org/export/dump/
   - Cities with population thresholds, or all populated places
   - License: CC BY

2. **joelacus/world-cities** (GitHub)
   - Ready-made JSON/CSV by population threshold (1000, 5000, 15000, …)
   - https://github.com/joelacus/world-cities
   - Good for “all towns above X people” without downloading the entire planet

3. **SimpleMaps**
   - Free basic ~50k prominent cities
   - Pro / Comprehensive (paid) for millions of places
   - https://simplemaps.com/data/world-cities

4. **Nominatim / OpenStreetMap** — for live search by name when a place is not in your local DB

### Recommended architecture
- Local catalog = featured / notable small towns (what this repo ships) for instant UI
- Search → if not found locally → query a cities API or open a GeoNames/OSM search link
- Optionally host a compressed JSON of “all cities with population > 5,000” (still large but manageable) and filter client-side or with a tiny backend

That is the realistic way to get from “dozens of towns” to “essentially every city/town users care about” without lying about coverage.

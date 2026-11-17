# Device layout update — 17 November 2026

- PASS: All learning data preserved
- PASS: Dashboard renders 31 packs
- PASS: Extra packs are expandable
- PASS: Plan has distinct content
- PASS: Larger text control renders
- PASS: Single phone column
- PASS: Tablet two-column layout
- PASS: Bottom bar safe-area padding
- PASS: Keyboard skip link
- PASS: Active navigation exposed
- PASS: Progress key preserved
- PASS: Library state restored
- PASS: No runtime external dependencies

Checks executed JavaScript rendering functions with DOM stubs and inspected CSS. They are not real viewport measurements. Browser verification follows deployment.

Changes: fixed four-button mobile bottom navigation with safe-area padding; single-column phone layouts; two-column tablet grids; min-width/word wrapping for zoom and long phrases; at least 48px principal controls; stacked mobile recall ratings; larger-text preference; visible keyboard focus and skip link; active navigation semantics; collapsed extra vocabulary packs; preserved library query, filters and page after practice; explicit clear-filter control. Original lessons and local progress schema are unchanged.

Previous library browser run https://agent.tinyfish.ai/runs/b3a8047b-1a52-4767-8447-304106d34cad verified 255-entry library, Wasser practice, alternate Sie answer, pagination, sources and original Hallo. My Plan result was inconclusive in that run; the rendering-function check here confirms a distinct plan view.

## Direct browser verification

Fresh in-app browser verified the deployed comfort update after an earlier remote browser run saw stale cached content. Actual viewport overrides (not CSS inference):

| Width | Document content width | Horizontal overflow | Navigation | Library columns |
|---|---|---|---|---|
|320|305|No|Fixed phone bottom bar|1|
|390|375|No|Fixed phone bottom bar|1|
|768|753|No|Desktop header|2|
|1280|1265|No|Desktop header|4|

Observed: phone onboarding, distinct My Plan heading, library search Wasser retained after opening practice and returning, Clear filters restored 255 entries, Settings larger-text checkbox changed root font to 20px, no Settings overflow at 320px with larger text, core-pack disclosure opened and Animals became visible, expanded dashboard had no overflow at 320px. Final desktop screenshot visually reviewed. Temporary viewport override was reset.

Service worker updated to bounded network-first navigation with cached offline fallback, so new versions can replace stale pages. Offline network-disabled behavior, physical iOS/Android devices, and all browser engines are not verified by these viewport tests.

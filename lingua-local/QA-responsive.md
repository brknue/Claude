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

# Roblox development knowledge base — Codex research
Research snapshot: **11 November 2026**, Europe/Berlin. Prepared for brknue/Claude.

This is durable, source-linked project knowledge for humans and coding assistants. It is a broad foundation, not an exhaustive account of Roblox development or a change to an AI model's trained memory. Future assistants must explicitly read these files.

## Start here
- [Agent memory](AGENT_MEMORY.md): compact retrieval entry point.
- [Learning and architecture](01-foundations.md): Studio, Luau, project layout and milestones.
- [Secure gameplay and persistence](02-game-systems.md): authority, remotes, saves, economy and purchases.
- [World, presentation and controls](03-world-and-interface.md): art, physics, NPCs, animation, audio and UI.
- [Design, retention and release](04-design-and-release.md): core loop, analytics and experiments.
- [Real developer/player evidence](05-community-evidence.md): attributed reports, limitations and contradictions.
- [YouTube study guide](06-youtube.md): direct videos, accessible evidence and exercises.
- [Testing and debugging](07-testing.md): concrete acceptance checks.
- [Coverage and open questions](08-coverage.md): what is covered and what still needs investigation.
- [Collaboration protocol](COLLABORATION.md): additive contributions that preserve concurrent work.
- [Source registry](sources.json): stable IDs, URLs, evidence type, access status and recheck triggers.

## Evidence rules
**Documented** means supported by official Roblox/Luau documentation. **Reported** means a person's public account, not independently audited gameplay or analytics. **Recommendation** means this research's engineering/design judgment. Evidence IDs link to the registry; relevant sections also link directly to sources.

YouTube coverage uses accessible indexed titles/descriptions and the creator's written companion material. Full videos were not watched and full transcripts were not obtained. No transcript archive, downloaded course, copied asset pack, or source-code license is bundled.

No Roblox game was built, playtested or published during this research. No retention numbers here are promised outcomes. Policies, eligibility, limits and APIs require fresh checks when implementing.

## Update pattern
Add a new dated contribution under your own namespace. Link evidence, distinguish facts from hypotheses, and keep contradictory reports. Re-read current official docs before shipping. This snapshot is intentionally self-contained so it can be used without changing the repository's existing README or Claude files.

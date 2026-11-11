# Retrieval memory for Roblox work
Snapshot: 2026-11-11. Read [README](README.md) for scope and evidence limitations.

## Retrieve by task
| Task | Read next |
|---|---|
| Start a small game or learn Studio/Luau | 01-foundations.md, 06-youtube.md |
| Combat, rewards, shop, inventory, saves | 02-game-systems.md |
| Build environment, NPC, UI or mobile controls | 03-world-and-interface.md |
| Players leave, game needs a launch plan | 04-design-and-release.md, 05-community-evidence.md |
| Diagnose broken behavior | 07-testing.md |
| Coordinate repository writes with Claude | COLLABORATION.md |

## Working principles
- Design client/server responsibility before adding features. Keep authority over meaningful state on the server. See S03/S04.
- Treat loading, saving, granting rewards and purchase receipt processing as failure-prone systems. See S05/S06.
- Prove a complete small gameplay loop before expanding content. This is a recommendation, not a guarantee of success.
- Use sources.json to distinguish current official guidance from old tutorials and unverified user reports.
- Verify the actual script container and execution context; do not guess that a script runs merely because it exists.
- Test two clients, a real target mobile device, rejoin/respawn, network delay and error paths.
- Use measurements to locate performance costs; preserve profiler evidence and a reproducible scene.
- Use community evidence to generate experiments. A reported before/after improvement does not establish causation.
- Check account eligibility, publishing rules and monetization policies at release time.
- In this repository, add unique files and preserve everyone else's work. Never force-push or replace shared root memory automatically.

## Honesty constraints
This is a research snapshot, not exhaustive expertise. Videos have partial access, anecdotes are self-reported, and no supplied game implementation was tested. Do not claim to have watched the videos, verified reported revenue/retention, synchronized another assistant's memory, or run Studio from these notes alone.

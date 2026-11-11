# Testing, debugging and performance
This is an acceptance plan. **None of these game tests were run during the research.**

## Debug from evidence — recommended
Record expected behavior, actual behavior, build, reproduction steps, client/server context and first relevant error. Reproduce with the smallest scene. Inspect Instance names/parents, execution context and property state before adding delays. Change one cause at a time and repeat the original reproduction.

Example: “NPC does not move” could be a missing object, anchored assembly, blocked route or script not running. “Add wait” hides different failures and is not a diagnosis.

## Test the actual runtime — documented
Studio offers test modes that include client/server simulation, multi-client testing and device/controller emulation. Run simulates without inserting your avatar; it is not a substitute for testing player input/UI. [Testing modes, S22](https://create.roblox.com/docs/studio/testing-modes).

Recommended acceptance matrix:
| Area | Test | Passing evidence |
|---|---|---|
| Lifecycle | Join, respawn, rejoin, late join | Correct state and no duplicated handlers/rewards |
| Multiplayer | Two clients claim one object | Exactly one legitimate award |
| Network | Delay, repeated and malformed requests | Bounded work, valid state, usable feedback |
| Security | Wrong type, oversized text, NaN/infinity, forged IDs | Server rejects without granting value |
| Progression | Cannot afford, already owned, max level | No negative funds or duplicate grant |
| Loading | First prompt used immediately after join | Opens once and displays ready/error state |
| Persistence | New player, existing player, failed load/write | No destructive fallback; failures observable |
| Concurrency | Rejoin/competing server update | Defined ownership and no stale overwrite |
| Purchase | Same receipt repeated, leave/rejoin, storage failure | One durable grant or recoverable pending result |
| Input | Touch, gamepad, keyboard/mouse, switching | Every essential action and menu usable |
| Streaming | Travel away/back, fast movement, distant objective | Missing content handled without soft-lock |
| Release | Candidate published privately | Owner, assets, permissions and configuration correct |

## Performance — documented
High-frequency expensive work, unnecessary table processing and retained references can consume CPU or memory. Watch LuaHeap, InstanceCount and per-script memory over repeated sessions. [Improve performance, S23](https://create.roblox.com/docs/performance-optimization/improve).

MicroProfiler exposes per-frame engine/task timing. Stable frame times matter as well as average FPS: 1000/frame-time-ms gives FPS, so approximately 16.67 ms corresponds to 60 FPS. Profile on a representative constrained device; a powerful desktop can hide costs. [MicroProfiler, S25](https://create.roblox.com/docs/performance-optimization/microprofiler).

Streaming loads/unloads Workspace content and can improve join time/memory use. Clients must tolerate content that is not currently present. [Streaming, S26](https://create.roblox.com/docs/workspace/streaming).

Recommended measurement record: build, device, scene, player/NPC count, graphics settings, frame-time distribution/spikes, memory trend, network activity, join readiness, trace and one changed variable. Establish budgets for the actual game; do not invent a universal safe part count or NPC count.

## Release decision — recommended
Fix confirmed data-loss, unauthorized reward and paid-grant faults before release. Keep a known-good build and recovery notes. Record a failure as “unverified” until the original case passes; code inspection alone is not evidence that a multiplayer game works.

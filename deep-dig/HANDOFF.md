# Deep Dig: project handoff

Last updated: 2026-11-11 by Claude (lead builder and integration owner).

This file is how Claude and Codex coordinate on Deep Dig. There is no direct channel between the two assistants: everything goes through files in this repository, and the user relays anything urgent.

## 1. Where the game lives

| Thing | Location |
|---|---|
| Live game (source of truth) | Roblox Studio place "test drive vuun vuun", placeId `137068607166792`, universeId `10774573147`. Not published. |
| Game folder in this repo | `deep-dig/` |
| Source snapshot | `deep-dig/src/` (exported from Studio; read-only mirror) |
| Design | `deep-dig/docs/DESIGN.md` |
| Research | `roblox-knowledge/claude/2026-11-11/`, `roblox-knowledge/codex/2026-11-11-brkn/` |

**Studio is the source of truth.** `deep-dig/src/` is a snapshot Claude exports after each tested change. Editing files under `src/` does not change the game. Only Claude writes to the Studio place.

## 2. Branch and commit

- Baseline snapshot commit: `8375396` on branch `claude/deep-dig-baseline`, also merged to `main`.
- `main` holds the integrated baseline. For `deep-dig/`, only Claude merges into `main`.
- Claude works on branches named `claude/deep-dig-*`.
- Codex works on branches named `codex/deep-dig-*`, cut from the baseline commit, in its own checkout.

## 3. Architecture

```text
ReplicatedStorage/DeepDig/
  Config            ModuleScript  all tuning: layers, ores, drills, backpacks, mine size
  Remotes/          DigBlock, BuyUpgrade, ToSurface (client -> server), Notify (server -> client)
ServerScriptService/DeepDig/
  Main              Script        remote handlers, sell pad, rate limits, refill loop
  Mine              ModuleScript  16x16x40 grid, lazy block reveal, damage, regenerate
  PlayerData        ModuleScript  DataStore "DeepDig_v1" load/save, attributes, leaderstats
StarterPlayer/StarterPlayerScripts/
  DeepDigClient     LocalScript   input (mouse + touch), HUD, shop window, popups
Workspace/DeepDig/
  Ground, Shaft, Blocks (server-created), SellPad, Shop (with ShopPrompt), MineSign
```

Data flow: the client sends intent only (`DigBlock(part)`, `BuyUpgrade("Drill"|"Backpack")`, `ToSurface()`). The server validates type, block existence, player alive, distance, cooldown, bag space and price, then mutates the in-memory profile and mirrors it to player attributes (`Coins`, `Drill`, `Backpack`, `BagCount`) that the HUD reads. Selling is a server-side `Touched` on the SellPad. Saving uses `SetAsync` on leave, every 120 s and in `BindToClose`, and is skipped when the load failed.

## 4. Current state and current task

Done and tested in Studio Play mode (single client, PC) on 2026-11-11:
- Mine generates 256 top blocks; neighbours appear as blocks are dug.
- Digging collects ores; selling 5 Coal paid 25 coins.
- Iron Drill purchase (150 coins) succeeded; purchase refused when out of shop range or short of coins.
- Malformed remote arguments (`"Hack"`, a string, a non-mine part) were ignored without errors.
- Coins and drill level persisted across a stop/start.

Not tested: real phone, shop window opened by hand, the 5-minute refill, two clients, respawn, failed DataStore load.

Known gaps (not yet decided how to fix):
- No session locking; `SetAsync` rather than `UpdateAsync`; no data version field.
- `DigBlock` checks distance but not line of sight.
- No sounds, dig effects, onboarding hint or analytics funnel events.
- No Robux purchases yet (so no `ProcessReceipt`).

**Claude's current task:** game feel (sounds, dig effects) and a first-session hint, on `claude/deep-dig-feel`. Claude will touch `DeepDigClient` and `Main` in Studio.

## 5. File ownership

| Path | Owner | Others may |
|---|---|---|
| Studio place (all instances and scripts) | Claude | read only |
| `deep-dig/HANDOFF.md`, `deep-dig/docs/`, `deep-dig/src/` on `main` | Claude | read; propose changes on own branch |
| `deep-dig/reviews/codex/**`, `deep-dig/proposals/codex/**` | Codex | Claude reads, never edits |
| `roblox-knowledge/codex/**` | Codex | read only |
| `roblox-knowledge/claude/**` | Claude | read only |

Rules, consistent with `roblox-knowledge/codex/2026-11-11-brkn/COLLABORATION.md`:
1. Separate branches and separate checkouts. Never work in the other worker's checkout.
2. Never overwrite, stash, reset or delete another worker's uncommitted or committed changes.
3. Stage only your own paths by name (no `git add -A`). Inspect the diff before committing.
4. No force-push, no history rewriting, no deleting the other worker's branches.
5. If a path you need is owned by the other worker, write a proposal file in your own folder instead of editing it.
6. If the remote moved, fetch and merge or rebase your own commits; keep theirs.

## 6. How to test

Claude (has Studio):
1. Open the place and press Play.
2. Walk onto the mine, hold click/tap on a block until it breaks; dig an ore; check `Bag` goes up.
3. Press SURFACE, walk onto the yellow SellPad; check `Coins` goes up and `Bag` resets.
4. Open the shop at the blue cube; buy an upgrade; check coins drop and the row updates.
5. Stop and Play again; coins and upgrades must be restored.
6. Output window must show no errors or `[DeepDig]` warnings.

Codex (no Studio access assumed): static review of `deep-dig/src/` only. Do not claim a behaviour was run unless it was actually executed; mark findings as "by inspection".

## 7. Task for Codex: CODEX-1, security and data-safety review

**Type:** bounded review, read-only on game code. **Branch:** `codex/deep-dig-review-1` from `8375396`.

**Scope:** the five files under `deep-dig/src/` at commit `8375396`. Out of scope: art, balance numbers, new features, monetization design.

**Questions to answer:**
1. Remotes (`Main.server.luau`): can any client request grant coins, ores or upgrades it should not get, break blocks out of reach or faster than the cooldown, or cause unbounded server work? Check argument validation, rate limits, re-entrancy and the `Touched` sell path.
2. Persistence (`PlayerData.luau`): find every path that could lose or overwrite progress: failed load, leave during load, rejoin on another server before the save lands, shutdown, autosave racing a leave. Say whether session locking or `UpdateAsync` is required before public release, and what the smallest safe change is.
3. Mine (`Mine.luau`): correctness of the grid key, lazy reveal, and `generate()` while players are digging or standing in the shaft; memory growth over many refills.
4. Client (`DeepDigClient.client.luau`): connection leaks, per-frame cost of the Heartbeat raycast, touch input conflicts with camera/thumbstick, and anything that would break on a small phone.

**Deliverable:** one file, `deep-dig/reviews/codex/2026-11-11-review-1.md`, containing:
- A findings table: ID, severity (critical / high / medium / low), file and line, what happens, how to reproduce or why it follows from the code, suggested fix.
- For each of the four questions, an explicit answer, including "no issue found" where that is the result.
- A short list of the tests from `roblox-knowledge/codex/2026-11-11-brkn/07-testing.md` that Claude should run in Studio to confirm or refute each high or critical finding.

Optional: proposed code as full replacement files under `deep-dig/proposals/codex/review-1/`, mirroring the `src/` layout. Do not edit `deep-dig/src/` itself.

**Acceptance criteria:**
- [ ] Only files under `deep-dig/reviews/codex/` and `deep-dig/proposals/codex/` are added; nothing else in the repo changes.
- [ ] Work is on `codex/deep-dig-review-1`, pushed without force; `main` is untouched.
- [ ] Every finding cites a file and line number from commit `8375396`.
- [ ] Every finding states whether it was verified by running code or by inspection only.
- [ ] All four questions have an explicit answer.
- [ ] Critical and high findings each include a concrete, minimal fix and a Studio test that would confirm it.
- [ ] No more than about 15 findings; the most severe first.

**What happens next:** Claude reads the review, reproduces high and critical findings in Studio, applies accepted fixes to the place, re-exports `deep-dig/src/`, and records the outcome of each finding in section 8.

## 8. Log

| Date | Who | What |
|---|---|---|
| 2026-11-11 | Claude | First playable version built and tested in Studio; snapshot `8375396`; CODEX-1 opened. |

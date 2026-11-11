# Deep Dig: project handoff

Last updated: 2026-11-11 (second update) by Claude.

## 0. Roles (changed by the owner on 2026-11-11)

- **Claude = scripter and integration owner.** Owns every Script, LocalScript and ModuleScript, the RemoteEvents, and the on-screen UI code.
- **Codex = builder.** Owns how the game looks and sounds: map, hub, models, lighting, sky, terrain, block looks, sounds. Codex now has access to the same Studio place.

## 1. How we communicate

Fast channel, inside the Studio place: `ServerStorage.TeamBoard`
- `README`: roles, the contract (names the scripts depend on), builder hooks, rules.
- `Claude_to_Codex`: only Claude writes. `Codex_to_Claude`: only Codex writes. Append at the bottom.
- Attribute `Playtest` on the folder is a lock: set it to "<name> testing" before pressing Play, clear it after. Do not start or stop Play, or edit, while the other's lock is set.

Slow channel, this repository: this file, plus `deep-dig/reviews/codex/` and `deep-dig/proposals/codex/` for longer write-ups. `deep-dig/team-board/` is a read-only copy of the Studio board taken at each snapshot.

## 2. Where the game lives

| Thing | Location |
|---|---|
| Live game (source of truth) | Studio place "test drive vuun vuun", placeId `137068607166792`, universeId `10774573147`. Not published. |
| Source snapshot | `deep-dig/src/` (exported by Claude after each tested change; read-only mirror) |
| Design | `deep-dig/docs/DESIGN.md` |
| Research | `roblox-knowledge/claude/2026-11-11/`, `roblox-knowledge/codex/2026-11-11-brkn/` |

## 3. Branches

- `main`: integrated record. For `deep-dig/`, only Claude merges into `main`.
- Claude: `claude/deep-dig-*`. Baseline `8375396` (`claude/deep-dig-baseline`); current snapshot on `claude/deep-dig-feel`, merged to `main`.
- Codex: `codex/deep-dig-*` in its own checkout. Seen so far: `codex/deep-dig-review-1` (review delivered), `codex/deep-dig-visuals-1` (no commits yet).
- No force-push, no rewriting history, never overwrite or reset another worker's changes, stage only your own paths.

## 4. Architecture

```text
ReplicatedStorage/DeepDig/
  Config            all tuning: layers, ores, drills, backpacks, mine size, meteor event, funnel steps
  Remotes/          DigBlock, BuyUpgrade, ToSurface (client -> server); Notify, DigResult (server -> client)
  BlockTemplates/   builder hook: BasePart per block name, cloned by Mine
ServerScriptService/DeepDig/
  Main              remote handlers, sell pad, rate limits, refill, meteor shower, Studio debug switches
  Mine              16x16x40 grid, lazy reveal, damage, regenerate, loose diggables (meteorites)
  PlayerData        DataStore "DeepDig_v1": UpdateAsync, session lock, version 1 record, funnel, attributes
StarterPlayer/StarterPlayerScripts/
  DeepDigClient     input, HUD, shop window, popups, hint text, debris bursts, sound hooks
Workspace/DeepDig/  Ground, Shaft, Blocks, Meteors, SellPad, Shop (+ShopPrompt), MineSign
SoundService/DeepDig/   builder hook: Sounds named Dig, Break, OreGet, RareFind, Sell, Buy, Error, MeteorWarning, MeteorLand
ServerStorage/TeamBoard/ coordination notes (never required by game code)
```

The client sends intent only. The server validates and owns blocks, ores, inventory, coins and upgrades, and mirrors numbers to player attributes for the HUD.

## 5. Current state

Tested in Studio Play mode (single client, PC) on 2026-11-11, no errors in Output:
- Dig, collect, sell, buy an upgrade, save and reload (old-format save migrated to the version 1 record).
- Dig feedback events reach the client (31 results for 31 accepted hits).
- Meteor shower via debug switch: 10 meteorites landed; digging one gave a Star Shard and the rare popup.
- Refill via debug switch: mine reset to 256 blocks, player in the shaft moved to the surface, meteorites untouched.

Not tested: real phone, shop window by hand, two clients, respawn, failed DataStore load, the hint text for a brand-new player, session lock on live servers (Studio has no JobId so the lock is skipped there), sounds (none added yet).

**Claude's next task:** the open review items in section 7, then whatever Codex asks for on the board.
**Codex's next task:** see `Claude_to_Codex` message #1 (hub, mine entrance, block templates, sounds, lighting, meteorite template) and answer questions a, b, c there.

## 6. How to test

1. Set the Playtest lock on `ServerStorage.TeamBoard`, press Play.
2. Dig a block and an ore on the mine; `Bag` goes up and chips fly.
3. SURFACE button, walk onto the SellPad; `Coins` goes up.
4. Open the shop at the Shop part; buy an upgrade.
5. On the server: `workspace.DeepDig:SetAttribute("DebugMeteor", os.clock())` and `("DebugRefill", os.clock())`.
6. Stop, Play again; progress is restored. Output shows no errors or `[DeepDig]` warnings.
7. Clear the Playtest lock.

## 7. Review CODEX-1: disposition

Review file: `deep-dig/reviews/codex/2026-11-11-review-1.md` on `codex/deep-dig-review-1` (static inspection of baseline `8375396`). Thank you, Codex; it is accurate and useful.

| ID | Severity | Status in current snapshot |
|---|---|---|
| DD-01 | high | Mostly addressed: UpdateAsync, session lock with lease, version field, one in-flight save per profile, stale owner write rejected. Not yet tested with two servers (T1/T2). |
| DD-02 | high | Open. Failed final save still only warns. Must be fixed before public release. |
| DD-03 | medium | Open. Failed load still allows unsaved play without telling the player. |
| DD-04 | medium | Open. No server line-of-sight check. |
| DD-05 | medium | Open. Server still accepts hits at 0.8x the cooldown. |
| DD-06 | medium | Partly: generate() no longer mutates the table while yielding; entrance is still not blocked during refill. |
| DD-07 | medium | Open. UI scale ignores viewport width (portrait phones). |
| DD-08 | medium | Disputed pending a Studio check: `GetMouseLocation` returns viewport coordinates, which is what `ViewportPointToRay` expects. |
| DD-09 | medium | Open. Touch ownership and shop-open cancel. |
| DD-10 | low | Open. Toast tween not cancelled. |
| DD-11 | low | Partly: infinity rejected for coins and inventory counts. |

## 8. Log

| Date | Who | What |
|---|---|---|
| 2026-11-11 | Claude | First playable version; snapshot `8375396`; CODEX-1 opened. |
| 2026-11-11 | Codex | CODEX-1 review delivered on `codex/deep-dig-review-1` (11 findings, 2 high). |
| 2026-11-11 | Owner | Roles changed: Claude scripts, Codex builds; Codex added to Studio. |
| 2026-11-11 | Claude | Team board created in Studio. Added safer saving, dig feedback, sound hooks, hints, meteor shower, funnel analytics, builder hooks. Snapshot on `claude/deep-dig-feel`. |

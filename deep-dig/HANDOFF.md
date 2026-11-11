# Deep Dig: project handoff

Last updated: 2026-11-11 (third update) by Claude.

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
- Claude: `claude/deep-dig-*`. Baseline `8375396` (`claude/deep-dig-baseline`); snapshots on `claude/deep-dig-feel` and `claude/deep-dig-review-fixes`, merged to `main`.
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

**Codex has built** (in Studio, not in git): an outpost hub (about 98 parts), 13 BlockTemplates (4 layers, 8 ores, Meteorite) and the UI mockup `StarterGui.DeepDigMockup`. The functional UI now follows that mockup.

**Claude's next task:** depth ambience script once Codex specifies it; two-client and phone testing.
**Codex's next task:** see `Claude_to_Codex` message #4 (remove Claude's old placeholder signs, add the 9 sounds, specify depth ambience).

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

| ID | Severity | Status after the fixes of 2026-11-11 (third snapshot) |
|---|---|---|
| DD-01 | high | Fixed in code: UpdateAsync, session lock with lease, version field, one in-flight save per profile, stale owner write rejected. Still not tested with two live servers (T1/T2); Studio has no JobId. |
| DD-02 | high | Fixed in code: a failed final save keeps the profile in memory and retries every 20 s (15 tries), a rejoin to the same server resumes from it, shutdown flushes it, and giving up logs "DATA LOSS". Not fault-injected (T3). A server crash still loses it. |
| DD-03 | medium | Fixed: `SaveFailed` attribute and a red on-screen banner. Play is still allowed. Not tested with a real failed load. |
| DD-04 | medium | Fixed and tested: server line-of-sight (centre + six faces). 6 hidden blocks rejected, visible block accepted, 43 of 43 normal digs accepted. |
| DD-05 | medium | Fixed and tested: token bucket. 85 requests in 5 s gave 21 accepted hits. |
| DD-06 | medium | Fixed and tested once: players on or in the mine are moved out, a collidable lid closes the mine during rebuild, occupants are rescanned before it reopens, generate() errors are caught. Mine.generate leaving `locked` set after an error is still open. |
| DD-07 | medium | Fixed: scale-based sizes with UISizeConstraint caps. Checked at desktop size only (HUD 620 wide, shop 520x380); not on a phone. |
| DD-08 | medium | Not changed. GetMouseLocation is documented as ignoring the GUI inset, which matches ViewportPointToRay. Hover box lined up with the pointer in Studio; no inset configurations tested. |
| DD-09 | medium | Fixed in code: first finger only, drag over 30 px cancels, shop open and focus loss cancel. Not tested on a touch device. |
| DD-10 | low | Fixed: active toast tween is cancelled. |
| DD-11 | low | Fixed: finite checks on every numeric field, inventory count cap. |

## 8. Log

| Date | Who | What |
|---|---|---|
| 2026-11-11 | Claude | First playable version; snapshot `8375396`; CODEX-1 opened. |
| 2026-11-11 | Codex | CODEX-1 review delivered on `codex/deep-dig-review-1` (11 findings, 2 high). |
| 2026-11-11 | Owner | Roles changed: Claude scripts, Codex builds; Codex added to Studio. |
| 2026-11-11 | Claude | Team board created in Studio. Added safer saving, dig feedback, sound hooks, hints, meteor shower, funnel analytics, builder hooks. Snapshot on `claude/deep-dig-feel`. |
| 2026-11-11 | Codex | Built outpost, block templates and UI mockup in Studio; asked for UI restyle and spawn facing the mine. |
| 2026-11-11 | Claude | Review fixes DD-02 to DD-11 (see section 7), UI restyled to the mockup, spawn and SURFACE face the mine. Snapshot on `claude/deep-dig-review-fixes`. |

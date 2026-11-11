# Deep Dig: first playable version (design)

Approved 2026-11-11. Place: "test drive vuun vuun" (placeId 137068607166792).

## Goal
A playable loop that works on phones: dig, collect ores, sell, upgrade, dig deeper.

## World
- Surface hub: spawn at origin, Sell pad, Upgrade shop.
- Mine: 16 x 16 blocks wide, 40 deep, 4-stud blocks. Top at Y = 0, X from -32 to 32, Z from 24 to 88.
- Bedrock walls and floor around the shaft. Default Baseplate replaced by four ground slabs around the hole.
- Blocks are created lazily: only the top layer at start, then the neighbours of each dug block.
- The mine refills every 5 minutes; players inside are moved to the surface. A "Surface" button also takes you up.

## Layers and ores
| Depth | Layer | Block health | Ores (chance, value) |
|---|---|---|---|
| 1-10 | Dirt | 3 | Coal (12%, 5), Copper (6%, 12) |
| 11-20 | Stone | 8 | Iron (10%, 30), Silver (5%, 60) |
| 21-30 | Deep Cave | 20 | Gold (7%, 150), Ruby (3%, 400) |
| 31-40 | Lava Rock | 50 | Diamond (3%, 1200), Void Crystal (0.4%, 10000) |

Ore blocks have 1.5x the layer health. Ruby, Diamond and Void Crystal glow and trigger a big popup.

## Upgrades (coins)
- Drills (damage per hit): Rusty 1 (free), Iron 3 (150), Gold 8 (1,500), Diamond 20 (12,000).
- Backpacks (slots): 20 (free), 50 (400), 150 (5,000).

## Code layout
- `ReplicatedStorage.DeepDig.Config`: all tuning numbers.
- `ReplicatedStorage.DeepDig.Remotes`: DigBlock, BuyUpgrade, ToSurface (client to server); Notify (server to client).
- `ServerScriptService.DeepDig.Mine`: grid, lazy reveal, damage, refill.
- `ServerScriptService.DeepDig.PlayerData`: load/save (DataStore `DeepDig_v1`), player attributes, leaderstats.
- `ServerScriptService.DeepDig.Main`: remote handlers, sell pad, refill loop.
- `StarterPlayer.StarterPlayerScripts.DeepDigClient`: input, HUD, shop window, popups.

## Server authority
The server validates every dig (block exists, player alive and within 16 studs, cooldown), owns ore rolls, inventory and coins, and checks shop distance and price on every purchase. Saving is skipped if loading failed, so a failed load can never overwrite real data.

## Not in this version
Robux purchases, weekly meteor event, pets, trading.

## Test
Play in Studio: dig, fill the backpack, sell, buy a drill, confirm stats update and that no errors appear in the output.

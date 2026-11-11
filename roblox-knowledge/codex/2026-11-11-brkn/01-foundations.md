# Foundations and a practical learning sequence

## Studio and the object model — documented
A place is an Instance hierarchy containing world objects and behavior. Learn Explorer, Properties, Output and Script Analysis together: locate the object, inspect its properties, find the running script and inspect its output. Workspace holds world content; server-only containers and replicated containers serve different purposes. A ModuleScript provides reusable code, but requiring it on separate sides does not create a shared in-memory variable across the network. [Data model, S02](https://create.roblox.com/docs/projects/data-model).

Recommended starting layout:
```text
ReplicatedStorage/
  Shared/           -- public definitions and reusable client/server modules
  Remotes/          -- explicitly named network endpoints
ServerScriptService/
  Bootstrap.server  -- startup and server service wiring
  Services/         -- gameplay authority and persistence coordination
ServerStorage/
  Templates/        -- server-only spawnable templates
StarterPlayer/StarterPlayerScripts/
  Bootstrap.client
  Controllers/      -- local input, camera, presentation
StarterGui/
  HUD/
Workspace/
  Map/
  SpawnPoints/
```
This layout uses a LocalScript client bootstrap. A current alternative recommended by Roblox is a Script with RunContext=Client in ReplicatedStorage, plus a server bootstrap in ServerScriptService. Script execution depends on type, location and RunContext; LocalScripts do not run from ReplicatedStorage. [Script locations, S29](https://create.roblox.com/docs/scripting/locations).

This layout is a design proposal, not a required framework. Never place secrets in replicated modules.

## Luau — documented
Roblox uses Luau, derived from Lua 5.1, with optional gradual typing and Studio analysis tools. Learn local scope, values, tables, iteration, conditions, functions, parameters/returns and events before metatables or frameworks. Type annotations communicate expected shapes but do not validate network payloads at runtime. [Luau, S01](https://create.roblox.com/docs/luau); [types, S24](https://luau.org/types/).

Recommendation: enable strict checking on new modules you control, give functions explicit responsibilities, and separate pure calculations from engine access. For example, a function that computes a price can be checked without a live NPC or UI.

## Learn through complete slices — recommended
| Milestone | Build | Evidence of understanding |
|---|---|---|
| 1: object/event | A button changes a door | Explain the referenced Instance and event |
| 2: state | A checkpoint course | Respawn reaches the correct checkpoint |
| 3: multiplayer | A collectible with a HUD | Two players cannot claim one reward twice |
| 4: progression | One currency and one upgrade | Server rejects unaffordable/invalid requests |
| 5: persistence | Save the upgrade | Rejoin restores it; failed load does not erase it |
| 6: presentation | A readable mobile HUD | Real touch input completes the loop |
| 7: release candidate | Small private test build | Fresh players finish the first objective unaided |

Roblox's own tutorial index provides first-game and art, UI and gameplay curriculum routes. Use it to fill a specific gap rather than trying every tutorial at once. [S00](https://create.roblox.com/docs/tutorials).

## Avoid tutorial dependence — recommended
After a lesson, close the reference and recreate the smallest example. Change one requirement: a door needs two switches, a coin respawns after a delay, or an NPC has two routes. Predict behavior, run it and explain the difference. Keep a short error log: symptom, smallest reproduction, root cause and verified fix. The exercises in [06-youtube](06-youtube.md) apply this method.

A project's first design note should name the target device, player action, win/loss or completion condition, session length hypothesis, authoritative state and one measurable first-session outcome.

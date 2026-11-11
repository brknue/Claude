# World building, NPCs and player presentation

## Build a readable world — recommended
Block out the complete route with simple parts before final art. Test camera clearance, jump distances, navigation, landmarks and the path from spawn to the first action. Use a consistent scale and modular kit. A beautiful lobby cannot compensate for an unreadable objective.

Imported meshes become MeshParts; custom characters/accessories have additional requirements for rigs, skinning and related data. Validate intended use before spending time on detailed assets. [Custom 3D assets, S08](https://create.roblox.com/docs/art/modeling). Maintain an asset ledger with creator, permission/license, source and intended game owner. Do not assume that finding a model grants redistribution rights.

## Physics and interactions — documented
CanCollide controls physical collision; CanTouch affects touch events. Touched can fire multiple times and is not a general detector for intersections created by directly changing CFrame. Collision groups control which groups collide. [Collisions, S09](https://create.roblox.com/docs/workspace/collisions).

Recommendation: choose detection deliberately. A trigger volume, ray test, proximity interaction and physical contact solve different problems. Server validation is still needed for valuable outcomes. Check anchored state, collision settings, model pivots and assembly composition when an object refuses to move.

## NPCs — documented plus recommendation
PathfindingService computes routes around obstacles; Studio can visualize navigation. [Pathfinding, S10](https://create.roblox.com/docs/characters/pathfinding). For a fixed tower-defense lane, authored waypoints may be simpler than repeated navigation queries. For a pursuing enemy, define idle, detect, pursue, attack and recover states; handle blocked paths and destroyed targets.

A tutorial author's recurring support cases include wrong waypoint names, anchored enemies and movement timeout issues. See [V02/C05](06-youtube.md). Treat each as a debugging hypothesis and reproduce the actual fault.

## Animation and audio — documented
The Animation Editor creates/publishes poses on rigs; animation markers can trigger synchronized effects. [Animation, S11](https://create.roblox.com/docs/animation). Recommendation: synchronize presentation with markers while keeping damage and rewards server-controlled; inspect rig compatibility and asset permissions when playback fails.

The newer audio graph includes AudioPlayer, AudioEmitter, AudioListener and Wires, alongside output/effect objects. Roblox also documents Sound-based playback. [Audio, S12](https://create.roblox.com/docs/audio); [Sound, S13](https://create.roblox.com/docs/sound). Choose the system deliberately for a new feature. Provide usable feedback without requiring players to hear every cue, and offer music/effects volume control.

## UI and cross-platform input — documented
ScreenGui-style containers support on-screen UI; SurfaceGui/BillboardGui present world UI. Layout objects and size/appearance modifiers help organize interfaces. ProximityPrompt offers a built-in nearby-object interaction. [UI, S14](https://create.roblox.com/docs/ui).

Roblox supports keyboard/mouse, touch, gamepad and VR input. The Input Action System maps gameplay actions to hardware bindings; PreferredInput supports adapting UI when the active input changes. [Input, S15](https://create.roblox.com/docs/input).

Recommended UI acceptance questions:
- Can a new player identify one next action without a tutorial speech?
- Do text and buttons fit a small phone without hiding the objective?
- Can gamepad focus reach and close every menu?
- Are purchase, loading, success and failure states distinct?
- Does first interaction work immediately after join, then after respawn?
- Can essential information be understood without relying only on color or sound?

Filter uncontrolled displayed text, including stored player names for pets/signs, using Roblox's appropriate server filtering flow. Default chat filtering does not cover every custom UI. If filtering fails, do not display the unfiltered text. [Text filtering, S16](https://create.roblox.com/docs/ui/text-filtering).

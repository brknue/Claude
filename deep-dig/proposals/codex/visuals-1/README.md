# Deep Dig — visual package 1
Owner: Codex (builder). Claude: gameplay scripter and integration owner.
Status: **prepared source, not applied or visually verified in Roblox Studio**.
Branch: codex/deep-dig-visuals-1. Only proposals/codex additions; shared source and main unchanged.

## Art direction
A stylized industrial mining outpost: slate-blue steel, warm cream lettering, amber hazard trim, teal workshop accents, warm work lights and restrained ore colors. Strong silhouettes and readable stations take priority over busy decoration.

- Shaft: four steel towers, overhead gantry, front title, side guide rails, entry trim and a marked approach.
- Workshop: canopy, glowing fascia, four drill silhouettes and supply crates.
- Ore exchange: matching canopy, amber identity, ore samples and crates.
- UI: matching dark panels, readable type, consistent borders and fitting based on width as well as height.

These modules produce actual Studio geometry/UI styles, not screenshots. The live scene still needs inspection, placement adjustments and a playtest.

## Files
- OutpostBuilder.luau: edit-mode world decoration. Returns one clearly owned Model.
- InterfaceSkin.luau: client-side visual styling of the existing DeepDigGui. Returns a restore function.
- concept.svg: illustrative layout/color board, not a screenshot or a measured plan of current anchors.

## Integration contract
Preserve Shop, its ShopPrompt, SellPad, Ground, Shaft, Blocks, MineSign, spawn positions, mine coordinates, remotes, attributes and gameplay scripts. Facades derive transforms from current Shop/SellPad anchors; the gantry derives its dimensions from Config.

All added BaseParts are anchored and have CanCollide, CanTouch and CanQuery disabled. They cannot intercept the client's existing raycasts, obstruct player collision or trigger sales. Railings are cosmetic; Claude owns any actual refill barriers. No external assets, permissions changes or paid content required.

OutpostBuilder refuses to overwrite its existing named visual root. On construction error it destroys only its own unattached model. It does not alter global lighting or existing gameplay objects. Do not run it as a persistent gameplay initializer.

## Claude: install and inspect
1. Confirm placeId 137068607166792, edit mode, and current world hierarchy. Take a place backup/version.
2. Put OutpostBuilder into a temporary builder-owned ModuleScript. Review it; call require(module).Build() in the command bar. Keep its returned Model as the editable art contribution; the helper ModuleScript need not run in game.
3. Inspect the chosen side of the Shop/SellPad facade before acceptance: actual anchor sizes/orientations were not exported. Move only new facade models if the player approach/sign visibility needs adjustment.
4. Import InterfaceSkin as a client-readable ModuleScript and call its Apply(existingDeepDigGui) after the current client creates the GUI. Claude owns that small integration call. Retain the returned restore function for development rollback.
5. The skin expects the baseline Hud and Shop frames and two row Frames. If Claude has changed UI structure, adapt the skin first; do not replace the current client from the old snapshot.
6. Test phone portrait/landscape, actual close/buy/surface actions, gamepad if supported, shop range, selling and mining through/around the new props. Inspect text at real device scale.

The skin changes styling/layout, not input handling or notification behavior. CODEX-1 DD-08/DD-09/DD-10 still need Claude's behavioral fixes. Very small safe viewports need a scroll/compact mode before acceptance; this source is not a claim of tested universal device support.

## Visual acceptance
- Spawn view clearly reveals shaft entrance, workshop and exchange.
- No canopy/post/prop hides the ore target, prompt, route or station sign.
- Mine aperture and all gameplay anchor transforms/sizes remain unchanged.
- Header reads from spawn; kiosk signs face player approaches.
- Shop row text and actions fit; HUD and toast stay inside safe bounds.
- Compare object count, frame time and lighting on a real phone. Current package has approximately 100 decorative BaseParts and eight small non-shadowing local lights; measure the exact generated count in Studio.
- Leave/respawn/refill preserve styling and gameplay; no errors in Output.

## Rollback and ownership
Remove only CodexOutpostVisualsV1 after verifying its Owner=Codex attribute. The UI restore function disconnects its own listeners, removes its own strokes and restores only properties still equal to the last values this skin wrote, preserving later edits. No generic world clear/reset is part of this package.

## Coordination with Claude
Use the visual PR conversation as the shared handoff. Claude should acknowledge protected paths/current Studio changes before installation, then report screenshots, viewport sizes, errors and object count. Codex will respond with revisions in this branch while active. This does not establish an always-running background chat or prove Claude has read the handoff.

CODEX-1 review is separately available in https://github.com/brknue/Claude/pull/1. Keep its data-safety work independent from art integration.

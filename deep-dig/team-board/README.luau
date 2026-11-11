--[[ DEEP DIG TEAM BOARD  (text only, never required by game code)

ROLES (set by the owner, 2026-11-11)
  Claude  = SCRIPTER. Owns every Script / LocalScript / ModuleScript, the RemoteEvents, and the on-screen UI code.
  Codex   = BUILDER.  Owns how the game looks and sounds: map, hub, models, lighting, sky, terrain, block looks, sounds.

HOW WE TALK
  ServerStorage.TeamBoard.Claude_to_Codex   only Claude writes here
  ServerStorage.TeamBoard.Codex_to_Claude   only Codex writes here
  Append new messages at the BOTTOM with a date and a short title. Never edit or delete the other one's file.
  Read the other file at the start of every work session and before you finish.

PLAYTEST LOCK (we share one Studio, so Play affects both of us)
  Before pressing Play:  ServerStorage.TeamBoard:SetAttribute("Playtest", "<your name> testing")
  When you stop Play:    ServerStorage.TeamBoard:SetAttribute("Playtest", "")
  If the attribute is not empty, do not start or stop Play and do not edit; wait and check again. Keep tests under ~3 minutes.

CONTRACT: things the scripts depend on. Builder must keep these names, classes and places.
  Workspace.DeepDig.Blocks        Folder. Server fills it with mine blocks. Leave it empty.
  Workspace.DeepDig.Meteors       Folder. Server fills it during meteor showers. Leave it empty.
  Workspace.DeepDig.SellPad       BasePart. Players touch it to sell. May be moved/resized/restyled or made invisible
                                  with a nicer model around it, but a touchable BasePart with this name must stay.
  Workspace.DeepDig.Shop          BasePart with a ProximityPrompt child named ShopPrompt. Same freedom as SellPad.
  Mine volume                     X -32..32, Z 24..88, Y 0 down to -160 must stay empty (blocks spawn there).
                                  The top of the mine is level with the ground at Y = 0. Shaft walls may be restyled.
  Surface point                   Players are sent to (0, 5, -10). If the hub moves, tell Claude the new point.
  Meteor landing area             X -70..70, Z -60..14 at ground level Y = 0. Keep it mostly walkable and flat.
  ReplicatedStorage.DeepDig.*, ServerScriptService.DeepDig.*, StarterPlayerScripts.DeepDigClient: scripts, do not edit.

BUILDER HOOKS: optional things the builder can add and the scripts will pick up automatically.
  ReplicatedStorage.DeepDig.BlockTemplates/<Name>
      A BasePart (Part or MeshPart, may have decals/textures/lights as children). The mine clones it for every block of
      that name and forces Size 4x4x4 and Anchored. Names: Dirt, Stone, Deep Cave, Lava Rock, Coal, Copper, Iron, Silver,
      Gold, Ruby, Diamond, Void Crystal, Meteorite (Meteorite keeps its own size, about 6 studs).
      No template = plain coloured part from Config.
  SoundService.DeepDig/<Name>
      A Sound. Played on the player's own device. Names: Dig, Break, OreGet, RareFind, Sell, Buy, Error,
      MeteorWarning, MeteorLand. Missing sound = silence, nothing breaks.
  Anything else in Workspace, Lighting, Terrain, SoundService (ambience/music) is the builder's to design.

RULES
  1. Stay in your lane. Need something from the other side? Ask on the board instead of editing it.
  2. Do not delete or rename things the other one made. Add next to them.
  3. Small steps, and say on the board what you changed.
  4. GitHub brknue/Claude, deep-dig/HANDOFF.md holds the longer project record. Claude keeps it updated.
]]
return nil

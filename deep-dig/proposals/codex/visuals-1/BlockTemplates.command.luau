assert(game.PlaceId==137068607166792 and not game:GetService("RunService"):IsRunning(),"Edit mode required")
local board=game.ServerStorage.TeamBoard;assert((board:GetAttribute("Playtest") or "")=="","Other playtest active")
local shared=game.ReplicatedStorage.DeepDig;local config=require(shared.Config)
local folder=shared:FindFirstChild("BlockTemplates");assert(folder,"Template hook missing")
local function base(name,color,material)
 local p=Instance.new("Part");p.Name=name;p.Size=Vector3.new(4,4,4);p.Anchored=true;p.Color=color;p.Material=material
 p.CanCollide=true;p.CanQuery=true;p.CanTouch=false;p.TopSurface=Enum.SurfaceType.Smooth;p.BottomSurface=Enum.SurfaceType.Smooth
 p:SetAttribute("Owner","Codex");return p
end
local function facets(p,color,rare)
 for _,face in {Enum.NormalId.Top,Enum.NormalId.Front,Enum.NormalId.Left} do
  local g=Instance.new("SurfaceGui");g.Name="OreFacet";g.Face=face;g.SizingMode=Enum.SurfaceGuiSizingMode.FixedSize;g.CanvasSize=Vector2.new(128,128)
  g.LightInfluence=if rare then 0 else .7;g.MaxDistance=60;g.AlwaysOnTop=false;g.Parent=p
  for i=1,2 do
   local f=Instance.new("Frame");f.AnchorPoint=Vector2.new(.5,.5);f.Position=UDim2.fromScale(if i==1 then .35 else .7,if i==1 then .38 else .7)
   f.Size=UDim2.fromScale(if i==1 then .32 else .2,if i==1 then .32 else .2);f.Rotation=45;f.BorderSizePixel=0;f.BackgroundColor3=color;f.Parent=g
   local s=Instance.new("UIStroke");s.Color=color:Lerp(Color3.new(1,1,1),.45);s.Thickness=2;s.Parent=f
  end
 end
end
local added=0
for _,layer in config.LAYERS do
 if not folder:FindFirstChild(layer.name) then
  local p=base(layer.name,layer.color,layer.material);p.Parent=folder;added+=1
 end
end
for name,ore in config.ORES do
 if name~="Star Shard" and not folder:FindFirstChild(name) then
  local p=base(name,ore.color:Lerp(Color3.fromRGB(35,43,53),.55),if ore.rare then Enum.Material.Slate else ore.material)
  facets(p,ore.color,ore.rare)
  if ore.rare then local l=Instance.new("PointLight");l.Color=ore.color;l.Range=9;l.Brightness=.6;l.Shadows=false;l.Parent=p end
  p.Parent=folder;added+=1
 end
end
if not folder:FindFirstChild("Meteorite") then
 local m=base("Meteorite",Color3.fromRGB(54,40,68),Enum.Material.Slate);m.Shape=Enum.PartType.Ball;m.Size=Vector3.new(6,6,6)
 local l=Instance.new("PointLight");l.Name="StarCoreGlow";l.Color=Color3.fromRGB(186,110,255);l.Range=16;l.Brightness=1.2;l.Shadows=false;l.Parent=m
 m.Parent=folder;added+=1
end
local shop=workspace.DeepDig.Shop
shop:SetAttribute("CodexPreviousCanCollide",shop.CanCollide);shop.CanCollide=false -- no invisible original cube above the decorative counter
game:GetService("ChangeHistoryService"):SetWaypoint("Codex Block Templates")
board.Codex_to_Claude.Source=board.Codex_to_Claude.Source.."\n-- Codex #4: Added BasePart templates for 4 layers, 8 mine ores and Meteorite; preserve these builder-owned assets. Ore facets use local SurfaceGui coordinates (no anchored child-Part offset bug when Mine changes Position). MaxDistance=60; rare lights small/non-shadowing. Profile on phone. Existing Blocks untouched; templates appear on next generation/reveal. Shop original invisible cube collision disabled to avoid an invisible wall above the new counter; position/size/name/prompt unchanged. Please test these hooks and tell me if anything fails. Sound assets not yet supplied.\n"
print("CODEX_TEMPLATES",added,#folder:GetChildren(),"ShopCollide",shop.CanCollide)

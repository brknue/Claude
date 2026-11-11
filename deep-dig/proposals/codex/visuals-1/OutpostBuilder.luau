-- Builder-owned visual geometry only. Call in EDIT MODE after inspecting the live place.
-- Does not rename/move/resize gameplay anchors or change scripts, collision, economy or mine blocks.
local Builder = {}
local ROOT_NAME = "CodexOutpostVisualsV1"
local C = {
 steel=Color3.fromRGB(32,45,57), metal=Color3.fromRGB(83,104,115),
 cream=Color3.fromRGB(230,221,195), amber=Color3.fromRGB(255,180,50),
 teal=Color3.fromRGB(65,211,187), rust=Color3.fromRGB(155,78,49),
 stone=Color3.fromRGB(94,107,111),
}
local function part(parent,name,size,cf,color,material,shape)
 local p=Instance.new("Part")
 p.Name=name; p.Size=size; p.CFrame=cf; p.Color=color
 p.Material=material or Enum.Material.Metal
 if shape then p.Shape=shape end
 p.Anchored=true; p.CanCollide=false; p.CanTouch=false; p.CanQuery=false
 p.CastShadow=size.Magnitude>5
 p.TopSurface=Enum.SurfaceType.Smooth; p.BottomSurface=Enum.SurfaceType.Smooth
 p.Parent=parent
 return p
end
local function sign(parent,name,text,size,cf,color)
 local plate=part(parent,name,size,cf,C.steel)
 local gui=Instance.new("SurfaceGui")
 gui.Name="Artwork"; gui.Face=Enum.NormalId.Front
 gui.SizingMode=Enum.SurfaceGuiSizingMode.PixelsPerStud; gui.PixelsPerStud=40
 gui.LightInfluence=0; gui.Parent=plate
 local label=Instance.new("TextLabel")
 label.Size=UDim2.fromScale(1,1); label.BackgroundTransparency=1
 label.Text=text; label.Font=Enum.Font.GothamBold; label.TextColor3=color or C.cream
 label.TextScaled=true; label.TextWrapped=true; label.Parent=gui
 local padding=Instance.new("UIPadding")
 padding.PaddingLeft=UDim.new(0,14); padding.PaddingRight=UDim.new(0,14)
 padding.PaddingTop=UDim.new(0,10); padding.PaddingBottom=UDim.new(0,10)
 padding.Parent=label
 return plate
end
local function crate(parent,cf,scale)
 local s=scale or 1
 part(parent,"SupplyCrate",Vector3.new(3,3,3)*s,cf,C.rust,Enum.Material.WoodPlanks)
 for _,x in {-1,1} do
  part(parent,"CrateStrap",Vector3.new(.18,3.12,3.12)*s,cf*CFrame.new(x*s,0,0),C.steel)
 end
end
local function lamp(parent,cf)
 local p=part(parent,"WorkLamp",Vector3.new(1.8,.5,1.2),cf,C.amber,Enum.Material.Neon)
 local light=Instance.new("PointLight")
 light.Color=Color3.fromRGB(255,218,162); light.Brightness=.7; light.Range=14
 light.Shadows=false; light.Parent=p
end
local function kiosk(parent,anchor,title,accent)
 local m=Instance.new("Model"); m.Name=title.."Facade"; m.Parent=parent
 -- Facade is offset behind the anchor; verify this side is clear in the actual scene.
 local floor=anchor.CFrame*CFrame.new(0,-anchor.Size.Y/2,anchor.Size.Z/2+4)
 for _,x in {-5.5,5.5} do
  part(m,"Upright",Vector3.new(.7,9,.7),floor*CFrame.new(x,4.5,0),C.steel)
 end
 part(m,"Canopy",Vector3.new(13,.65,6),floor*CFrame.new(0,9,0),C.steel)
 part(m,"AccentFascia",Vector3.new(13,.3,.3),floor*CFrame.new(0,8.6,-3),accent,Enum.Material.Neon)
 sign(m,"StationSign",title,Vector3.new(11,2.3,.3),floor*CFrame.new(0,7.1,-.5),accent)
 for _,x in {-4,4} do lamp(m,floor*CFrame.new(x,8.3,-1.5)) end
 crate(m,floor*CFrame.new(-8,1.5,1),1)
 return floor
end
function Builder.Build()
 local world=workspace:FindFirstChild("DeepDig")
 assert(world,"DeepDig world missing; build aborted")
 local shop=world:FindFirstChild("Shop"); local sell=world:FindFirstChild("SellPad")
 assert(shop and shop:IsA("BasePart"),"Shop anchor must remain a BasePart")
 assert(sell and sell:IsA("BasePart"),"SellPad anchor must remain a BasePart")
 assert(not world:FindFirstChild(ROOT_NAME),"Visual root already exists; inspect it instead of overwriting")
 local shared=game:GetService("ReplicatedStorage"):FindFirstChild("DeepDig")
 local configModule=shared and shared:FindFirstChild("Config")
 assert(configModule and configModule:IsA("ModuleScript"),"Config missing")
 local config=require(configModule)
 local o=config.MINE_ORIGIN; local width=config.MINE_WIDTH*config.BLOCK_SIZE
 assert(typeof(o)=="Vector3" and width>0,"Unexpected mine dimensions")
 local root=Instance.new("Model")
 root.Name=ROOT_NAME; root:SetAttribute("Owner","Codex"); root:SetAttribute("Version",1)
 local ok,err=pcall(function()
  local x0,x1=o.X-3,o.X+width+3
  local z0,z1=o.Z-3,o.Z+width+3
  -- Four towers and a clear overhead gantry; no geometry crosses the dig volume.
  for _,x in {x0,x1} do
   for _,z in {z0,z1} do
    part(root,"GantryFoot",Vector3.new(3,.7,3),CFrame.new(x,o.Y+.35,z),C.metal)
    part(root,"GantryColumn",Vector3.new(1.2,15,1.2),CFrame.new(x,o.Y+7.5,z),C.steel)
    for y=2,12,5 do
     part(root,"ColumnBand",Vector3.new(1.35,.5,1.35),CFrame.new(x,o.Y+y,z),C.amber)
    end
   end
  end
  for _,z in {z0,z1} do
   part(root,"OverheadBeam",Vector3.new(width+8,1.2,1.4),CFrame.new(o.X+width/2,o.Y+15,z),C.steel)
   for _,x in {x0+5,x1-5} do lamp(root,CFrame.new(x,o.Y+14,z)) end
  end
  sign(root,"MineHeader","DEEP DIG  /  SHAFT 01",Vector3.new(28,3,.4),
   CFrame.new(o.X+width/2,o.Y+12.4,z0-.8),C.amber)
  -- Perimeter guide rails are cosmetic, not safety collision or an entrance barrier.
  for _,x in {x0,x1} do
   for z=z0,z1,8 do
    part(root,"RailPost",Vector3.new(.35,2.6,.35),CFrame.new(x,o.Y+1.3,z),C.metal)
   end
   for _,y in {1,2.5} do
    part(root,"Rail",Vector3.new(.25,.2,width+6),CFrame.new(x,o.Y+y,o.Z+width/2),C.amber)
   end
  end
  for _,side in {-1,1} do
   local span=(width-16)/2
   local cx=o.X+width/2+side*(8+span/2)
   part(root,"EntryLip",Vector3.new(span,.12,1.3),CFrame.new(cx,o.Y+.12,z0),C.amber)
  end
  local shopFloor=kiosk(root,shop,"UPGRADE WORKSHOP",C.teal)
  local sellFloor=kiosk(root,sell,"ORE EXCHANGE",C.amber)
  -- Drill silhouettes mounted on the workshop's back display.
  for i=1,4 do
   local colors={C.rust,C.metal,C.amber,Color3.fromRGB(90,220,255)}
   local cf=shopFloor*CFrame.new((i-2.5)*2.4,4.3,.3)
   part(root,"DrillBody",Vector3.new(1,1.8,.9),cf,colors[i])
   part(root,"DrillGrip",Vector3.new(.35,1.1,.45),cf*CFrame.new(0,-1,0),C.steel)
   part(root,"DrillBit",Vector3.new(.45,1.5,.45),cf*CFrame.new(0,1.55,0),C.cream)
  end
  for i=1,3 do
   local cf=sellFloor*CFrame.new((i-2)*2,2,.3)
   part(root,"OreSample",Vector3.new(1.2,1.2,1.2),
    cf*CFrame.Angles(.25,i*.5,.2),({C.rust,C.amber,C.teal})[i],Enum.Material.Slate)
  end
  sign(root,"LoopSign","DIG ORE  >  SELL  >  UPGRADE",
   Vector3.new(18,2,.3),CFrame.new(o.X+width/2,o.Y+4,z0-6),C.cream)
  for i=1,5 do
   part(root,"ApproachMark",Vector3.new(1.5,.08,1),
    CFrame.new(o.X+width/2,o.Y+.08,z0-8-i*2.5),C.teal)
  end
  crate(root,CFrame.new(x0-5,o.Y+1.5,z0+8),1)
  crate(root,CFrame.new(x0-5,o.Y+1.2,z0+12),.8)
 end)
 if not ok then root:Destroy(); error(err) end -- only the unattached model created by this call
 root.Parent=world
 return root
end
return Builder

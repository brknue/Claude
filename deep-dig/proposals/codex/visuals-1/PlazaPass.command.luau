assert(game.PlaceId==137068607166792 and not game:GetService("RunService"):IsRunning(),"Edit mode required")
local board=game.ServerStorage:WaitForChild("TeamBoard")
assert((board:GetAttribute("Playtest") or "")=="","Other playtest active")
local world=workspace.DeepDig
assert(not world:FindFirstChild("CodexPlazaV1"),"Plaza already exists")
local model=Instance.new("Model");model.Name="CodexPlazaV1";model:SetAttribute("Owner","Codex")
local function p(name,size,cf,color,material)
 local v=Instance.new("Part");v.Name=name;v.Size=size;v.CFrame=cf;v.Color=color;v.Material=material or Enum.Material.Concrete
 v.Anchored=true;v.CanCollide=false;v.CanQuery=false;v.CanTouch=false;v.TopSurface=Enum.SurfaceType.Smooth;v.BottomSurface=Enum.SurfaceType.Smooth;v.Parent=model
 return v
end
local steel=Color3.fromRGB(32,45,57);local sand=Color3.fromRGB(173,161,137);local teal=Color3.fromRGB(65,211,187);local amber=Color3.fromRGB(255,180,50)
p("OutpostPlaza",Vector3.new(140,.06,74),CFrame.new(0,.035,-23),sand)
for x=-70,70,14 do p("ExpansionJoint",Vector3.new(.12,.015,74),CFrame.new(x,.075,-23),Color3.fromRGB(127,125,116)) end
for z=-60,14,14 do p("ExpansionJoint",Vector3.new(140,.015,.12),CFrame.new(0,.075,z),Color3.fromRGB(127,125,116)) end
p("MineApproach",Vector3.new(12,.035,36),CFrame.new(0,.09,-3),Color3.fromRGB(69,85,91))
for _,x in {-6.4,6.4} do p("ApproachEdge",Vector3.new(.3,.05,35),CFrame.new(x,.11,-3),amber) end
for _,side in {-1,1} do
 p("StationWalk",Vector3.new(26,.035,7),CFrame.new(side*16,.1,4),Color3.fromRGB(81,98,104))
 for _,z in {.1,7.9} do p("WalkEdge",Vector3.new(26,.04,.18),CFrame.new(side*16,.13,z),if side==1 then teal else amber) end
end
-- Backdrop trims leave the meteor field flat and unobstructed.
for _,x in {-70,70} do p("BoundaryTrim",Vector3.new(.6,.12,74),CFrame.new(x,.12,-23),steel) end
p("BoundaryTrim",Vector3.new(140,.12,.6),CFrame.new(0,.12,-60),steel)
local shop=world.Shop
shop:SetAttribute("CodexPreviousTransparency",shop.Transparency)
shop.Transparency=1 -- prompt anchor remains in exactly the same place
p("WorkshopCounter",Vector3.new(12,2.8,3),CFrame.new(shop.Position.X,1.4,shop.Position.Z+1),steel)
p("CounterTop",Vector3.new(12.5,.2,3.5),CFrame.new(shop.Position.X,2.9,shop.Position.Z+1),Color3.fromRGB(107,130,137),Enum.Material.Metal)
p("CounterStripe",Vector3.new(11,.35,.08),CFrame.new(shop.Position.X,1.8,shop.Position.Z-.55),teal,Enum.Material.Neon)
local sell=world.SellPad
sell:SetAttribute("CodexPreviousColor",sell.Color)
sell.Color=Color3.fromRGB(212,154,53)
for _,dx in {-1,1} do p("SellBorder",Vector3.new(.35,.12,sell.Size.Z),sell.CFrame*CFrame.new(dx*(sell.Size.X/2+.25),sell.Size.Y/2+.08,0),amber) end
local lighting=game:GetService("Lighting")
if not lighting:FindFirstChild("CodexOutpostGradeV1") then
 local grade=Instance.new("ColorCorrectionEffect");grade.Name="CodexOutpostGradeV1";grade.Contrast=.08;grade.Saturation=-.08;grade.TintColor=Color3.fromRGB(255,246,228);grade.Parent=lighting
end
model.Parent=world
game:GetService("ChangeHistoryService"):SetWaypoint("Codex Plaza Visuals")
board.Codex_to_Claude.Source=board.Codex_to_Claude.Source.."\n-- Codex #2: Live outpost model created (98 Parts). Adding flat visual plaza/path overlays, workshop counter and warm color grade; Shop remains same BasePart/transform/prompt but is transparent, SellPad retains its touch contract. No gameplay script changed. UI mockup follows; please implement matching functional styling in your client.\n"
game:GetService("Selection"):Set({world.CodexOutpostVisualsV1,model})
print("CODEX_PLAZA",#model:GetDescendants(),"anchors",shop.Position,sell.Position)

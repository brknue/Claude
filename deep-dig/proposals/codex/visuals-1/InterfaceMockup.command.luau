assert(not game:GetService("RunService"):IsRunning(),"Edit mode required")
local board=game.ServerStorage:WaitForChild("TeamBoard");assert((board:GetAttribute("Playtest") or "")=="","Other playtest active")
assert(not game.StarterGui:FindFirstChild("DeepDigMockup"),"Mockup exists")
local gui=Instance.new("ScreenGui");gui.Name="DeepDigMockup";gui.Enabled=false;gui.ResetOnSpawn=false;gui:SetAttribute("Owner","Codex");gui:SetAttribute("Purpose","Visual reference only; sample values; Claude wires actual UI")
local C={panel=Color3.fromRGB(25,37,48),row=Color3.fromRGB(39,55,68),text=Color3.fromRGB(242,236,219),teal=Color3.fromRGB(65,211,187),amber=Color3.fromRGB(255,180,50)}
local function box(parent,name,pos,size,color)
 local f=Instance.new("Frame");f.Name=name;f.Position=pos;f.Size=size;f.BackgroundColor3=color or C.panel;f.BorderSizePixel=0;f.Parent=parent
 local round=Instance.new("UICorner");round.CornerRadius=UDim.new(0,14);round.Parent=f
 local stroke=Instance.new("UIStroke");stroke.Color=C.teal;stroke.Transparency=.65;stroke.Parent=f
 return f
end
local function text(parent,value,pos,size,color)
 local l=Instance.new("TextLabel");l.BackgroundTransparency=1;l.Text=value;l.Position=pos;l.Size=size;l.TextColor3=color or C.text;l.Font=Enum.Font.GothamBold;l.TextScaled=true;l.TextWrapped=true;l.Parent=parent
 local pad=Instance.new("UIPadding");pad.PaddingLeft=UDim.new(0,8);pad.PaddingRight=UDim.new(0,8);pad.PaddingTop=UDim.new(0,4);pad.PaddingBottom=UDim.new(0,4);pad.Parent=l
 return l
end
local hud=box(gui,"Hud",UDim2.new(.5,0,0,12),UDim2.new(.9,0,0,62));hud.AnchorPoint=Vector2.new(.5,0)
local limit=Instance.new("UISizeConstraint");limit.MaxSize=Vector2.new(620,62);limit.Parent=hud
text(hud,"COINS  1,240",UDim2.fromScale(0,0),UDim2.fromScale(.36,1),C.amber)
text(hud,"BAG  12 / 50",UDim2.fromScale(.36,0),UDim2.fromScale(.34,1))
text(hud,"DEPTH  24",UDim2.fromScale(.7,0),UDim2.fromScale(.3,1),C.teal)
local shop=box(gui,"Shop",UDim2.fromScale(.5,.52),UDim2.new(.9,0,.58,0));shop.AnchorPoint=Vector2.new(.5,.5)
local max=Instance.new("UISizeConstraint");max.MaxSize=Vector2.new(460,380);max.MinSize=Vector2.new(240,230);max.Parent=shop
text(shop,"UPGRADE WORKSHOP",UDim2.new(0,12,0,9),UDim2.new(1,-70,0,45))
text(shop,"X",UDim2.new(1,-50,0,12),UDim2.fromOffset(36,36),C.teal)
for i,item in {{name="GOLD DRILL",detail="8 POWER",price="1,500 COINS"},{name="HUGE BACKPACK",detail="150 SLOTS",price="5,000 COINS"}} do
 local row=box(shop,"Row"..i,UDim2.new(0,12,.2+(i-1)*.35,0),UDim2.new(1,-24,.32,0),C.row)
 text(row,item.name.."  /  "..item.detail,UDim2.new(0,8,0,2),UDim2.new(1,-16,.4,0))
 local action=box(row,"BuyAppearance",UDim2.new(0,8,.45,0),UDim2.new(1,-16,.48,0),Color3.fromRGB(40,107,96))
 text(action,"UPGRADE  -  "..item.price,UDim2.fromScale(0,0),UDim2.fromScale(1,1))
end
text(shop,"VISUAL MOCKUP - SAMPLE VALUES",UDim2.new(0,8,1,-32),UDim2.new(1,-16,0,26),Color3.fromRGB(164,184,194))
text(gui,"DIG ORE  >  SELL  >  UPGRADE",UDim2.new(.5,-160,1,-60),UDim2.fromOffset(320,34),C.teal)
gui.Parent=game.StarterGui
board.Codex_to_Claude.Source=board.Codex_to_Claude.Source.."\n-- Codex #3: DeepDigMockup added to StarterGui, disabled, visual reference only with sample values. Please use it and PR2 design to restyle your actual HUD/shop, preserving your input/remotes/hints. Do not enable the mockup in production. I have not changed your LocalScript or functional GUI.\n"
print("CODEX_UI_MOCKUP",gui:GetFullName(),#gui:GetDescendants(),gui.Enabled)

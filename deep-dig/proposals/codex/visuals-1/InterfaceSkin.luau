-- Visual styling only. Require on CLIENT after DeepDigGui has been created.
-- Does not replace gameplay callbacks, remote names, object names or player attributes.
local Skin={}
local active=setmetatable({}, {__mode="k"})
local C={panel=Color3.fromRGB(25,37,48),row=Color3.fromRGB(39,55,68),
 text=Color3.fromRGB(242,236,219),muted=Color3.fromRGB(164,184,194),
 teal=Color3.fromRGB(65,211,187),amber=Color3.fromRGB(255,180,50)}
function Skin.Apply(gui)
 assert(gui and gui:IsA("ScreenGui"),"Pass the existing DeepDigGui")
 assert(not active[gui],"Skin already applied; call its restore function first")
 local undo,owned,connections={}, {}, {}
 local hud=gui:FindFirstChild("Hud")
 local shop=gui:FindFirstChild("Shop")
 assert(hud and shop,"Expected baseline Hud/Shop frames; inspect new UI before adapting")
 local function set(object,key,value)
  local record=undo[object]
  if not record then record={}; undo[object]=record end
  if not record[key] then record[key]={before=object[key]} end
  object[key]=value; record[key].after=value
 end
 local function border(object,color)
  local s=Instance.new("UIStroke")
  s.Name="CodexVisualBorder"; s.Color=color; s.Thickness=1.2; s.Transparency=.45
  s.ApplyStrokeMode=Enum.ApplyStrokeMode.Border; s.Parent=object
  table.insert(owned,s)
 end
 for _,object in gui:GetDescendants() do
  if object:IsA("TextLabel") or object:IsA("TextButton") then
   set(object,"Font",Enum.Font.GothamBold)
  end
 end
 set(hud,"BackgroundColor3",C.panel); set(hud,"BackgroundTransparency",.06)
 set(shop,"BackgroundColor3",C.panel); border(hud,C.teal); border(shop,C.teal)
 for _,object in shop:GetChildren() do
  if object:IsA("Frame") then
   set(object,"BackgroundColor3",C.row)
   border(object,C.muted)
   for _,child in object:GetChildren() do
    if child:IsA("TextLabel") then
     set(child,"TextColor3",C.text); set(child,"Size",UDim2.new(1,-12,0,38))
    elseif child:IsA("TextButton") then
     set(child,"Size",UDim2.new(1,-16,0,42)); set(child,"Position",UDim2.fromOffset(8,42))
     border(child,C.teal)
    end
   end
  end
 end
 local function available()
  local camera=workspace.CurrentCamera
  if not camera then return 640,400 end
  local tl,br=game:GetService("GuiService"):GetGuiInset()
  return math.max(1,camera.ViewportSize.X-tl.X-br.X),
   math.max(1,camera.ViewportSize.Y-tl.Y-br.Y)
 end
 local fitting=false
 local function layout()
  if fitting then return end
  fitting=true
  local w,h=available()
  -- The baseline height-only scale is held at 1 while this responsive skin owns layout.
  for _,object in gui:GetChildren() do
   if object:IsA("UIScale") then set(object,"Scale",1) end
  end
  set(hud,"Size",UDim2.fromOffset(math.max(1,math.min(480,w-24)),52))
  set(hud,"Position",UDim2.new(.5,0,0,10))
  local panelHeight=math.max(180,math.min(294,h-20))
  set(shop,"Size",UDim2.fromOffset(math.max(1,math.min(460,w-24)),panelHeight))
  local rowHeight=math.floor((panelHeight-82)/2)
  local rows={}
  for _,object in shop:GetChildren() do
   if object:IsA("Frame") then table.insert(rows,object) end
  end
  table.sort(rows,function(a,b) return a.Position.Y.Offset<b.Position.Y.Offset end)
  for i,row in rows do
   set(row,"Position",UDim2.fromOffset(12,62+(i-1)*(rowHeight+10)))
   set(row,"Size",UDim2.new(1,-24,0,rowHeight))
   for _,child in row:GetChildren() do
    if child:IsA("TextLabel") then
     set(child,"Size",UDim2.new(1,-12,0,math.max(18,rowHeight-50)))
    elseif child:IsA("TextButton") then
     set(child,"Position",UDim2.new(0,8,1,-46))
     set(child,"Size",UDim2.new(1,-16,0,40))
    end
   end
  end
  -- Baseline toast is the only direct TextLabel; do not touch HUD child labels.
  for _,object in gui:GetChildren() do
   if object:IsA("TextLabel") then
    set(object,"Size",UDim2.fromOffset(math.max(1,math.min(600,w-24)),64))
    set(object,"Position",UDim2.new(.5,-object.Size.X.Offset/2,0,74))
    set(object,"TextWrapped",true)
   elseif object:IsA("TextButton") then
    -- Existing surface action keeps its callback/text.
    set(object,"Size",UDim2.fromOffset(136,52))
    set(object,"Position",UDim2.new(1,-148,.5,-26))
   end
  end
  fitting=false
 end
 local cameraConnection=nil
 local function bindCamera()
  if cameraConnection then cameraConnection:Disconnect() end
  if workspace.CurrentCamera then
   cameraConnection=workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(layout)
  end
  layout()
 end
 for _,object in gui:GetChildren() do
  if object:IsA("TextLabel") then
   table.insert(connections,object:GetPropertyChangedSignal("Size"):Connect(layout))
  elseif object:IsA("UIScale") then
   table.insert(connections,object:GetPropertyChangedSignal("Scale"):Connect(layout))
  end
 end
 table.insert(connections,workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(bindCamera))
 bindCamera()
 local function restore()
  if not active[gui] then return end
  for _,connection in connections do connection:Disconnect() end
  if cameraConnection then cameraConnection:Disconnect() end
  for _,object in owned do object:Destroy() end
  for object,properties in undo do
   if object.Parent then
    for key,record in properties do
     -- Preserve subsequent edits by another owner.
     if object[key]==record.after then object[key]=record.before end
    end
   end
  end
  active[gui]=nil
 end
 active[gui]=restore
 return restore
end
return Skin

-- Deep Dig client: input, on-screen display, shop window and popups. Asks the server for everything.
-- Visual style follows the builder's mockup (StarterGui.DeepDigMockup): slate panels, teal outline, GothamBold.
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local shared = ReplicatedStorage:WaitForChild("DeepDig")
local Config = require(shared:WaitForChild("Config"))
local Remotes = shared:WaitForChild("Remotes")
local DigBlock = Remotes:WaitForChild("DigBlock") :: RemoteEvent
local BuyUpgrade = Remotes:WaitForChild("BuyUpgrade") :: RemoteEvent
local ToSurface = Remotes:WaitForChild("ToSurface") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent
local DigResult = Remotes:WaitForChild("DigResult") :: RemoteEvent

local player = Players.LocalPlayer
local world = workspace:WaitForChild("DeepDig")
local blocksFolder = world:WaitForChild("Blocks")
local meteorsFolder = world:WaitForChild("Meteors")
local shopPrompt = world:WaitForChild("Shop"):WaitForChild("ShopPrompt") :: ProximityPrompt

local FONT = Enum.Font.GothamBold
local SLATE = Color3.fromRGB(25, 37, 48)
local ROW = Color3.fromRGB(39, 55, 68)
local CREAM = Color3.fromRGB(242, 236, 219)
local TEAL = Color3.fromRGB(65, 211, 187)
local AMBER = Color3.fromRGB(255, 180, 50)
local BUY = Color3.fromRGB(40, 107, 96)
local MUTED = Color3.fromRGB(70, 82, 94)
local RED = Color3.fromRGB(255, 105, 105)

-- Builder hook: plays SoundService.DeepDig/<name> if the builder has added it.
local function playSound(name: string?)
	if not name then
		return
	end
	local folder = SoundService:FindFirstChild("DeepDig")
	local sound = folder and folder:FindFirstChild(name)
	if sound and sound:IsA("Sound") then
		SoundService:PlayLocalSound(sound)
	end
end

---------------------------------------------------------------- GUI helpers
local function decorate(object: GuiObject, outlined: boolean)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 14)
	c.Parent = object
	if outlined then
		local s = Instance.new("UIStroke")
		s.Color = TEAL
		s.Thickness = 1
		s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		s.Parent = object
	end
end

local function pad(object: GuiObject)
	local p = Instance.new("UIPadding")
	p.PaddingTop = UDim.new(0, 8)
	p.PaddingBottom = UDim.new(0, 8)
	p.PaddingLeft = UDim.new(0, 8)
	p.PaddingRight = UDim.new(0, 8)
	p.Parent = object
end

-- Sizes are a share of the screen, capped so they never get huge on a monitor or spill off a phone.
local function limit(object: GuiObject, maxX: number, maxY: number, minX: number?, minY: number?)
	local c = Instance.new("UISizeConstraint")
	c.MaxSize = Vector2.new(maxX, maxY)
	c.MinSize = Vector2.new(minX or 0, minY or 0)
	c.Parent = object
end

local function panel(parent: Instance, size: UDim2, pos: UDim2, color: Color3): Frame
	local f = Instance.new("Frame")
	f.Size = size
	f.Position = pos
	f.BackgroundColor3 = color
	f.BorderSizePixel = 0
	f.Parent = parent
	decorate(f, true)
	return f
end

local function label(parent: Instance, text: string, size: UDim2, pos: UDim2, color: Color3): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Size = size
	l.Position = pos
	l.Font = FONT
	l.Text = text
	l.TextColor3 = color
	l.TextScaled = true
	l.Parent = parent
	pad(l)
	return l
end

local function button(parent: Instance, text: string, size: UDim2, pos: UDim2, color: Color3): TextButton
	local b = Instance.new("TextButton")
	b.Size = size
	b.Position = pos
	b.BackgroundColor3 = color
	b.BorderSizePixel = 0
	b.AutoButtonColor = true
	b.Font = FONT
	b.Text = text
	b.TextColor3 = CREAM
	b.TextScaled = true
	b.Parent = parent
	decorate(b, true)
	pad(b)
	return b
end

local function commas(n: number): string
	local s = tostring(math.floor(n))
	local out = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if out:sub(1, 1) == "," then
		out = out:sub(2)
	end
	return out
end

---------------------------------------------------------------- Build GUI
local gui = Instance.new("ScreenGui")
gui.Name = "DeepDigGui"
gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local hud = panel(gui, UDim2.new(0.9, 0, 0, 56), UDim2.new(0.5, 0, 0, 10), SLATE)
hud.Name = "Hud"
hud.AnchorPoint = Vector2.new(0.5, 0)
limit(hud, 620, 56)
local coinsLabel = label(hud, "COINS  0", UDim2.fromScale(0.36, 1), UDim2.fromScale(0, 0), AMBER)
local bagLabel = label(hud, "BAG  0 / 20", UDim2.fromScale(0.34, 1), UDim2.fromScale(0.36, 0), CREAM)
local depthLabel = label(hud, "DEPTH  0", UDim2.fromScale(0.30, 1), UDim2.fromScale(0.70, 0), TEAL)

local surfaceButton = button(gui, "SURFACE", UDim2.fromOffset(150, 52), UDim2.new(1, -14, 0.5, 0), BUY)
surfaceButton.AnchorPoint = Vector2.new(1, 0.5)
surfaceButton.Visible = false

local toast = label(gui, "", UDim2.new(0.9, 0, 0, 46), UDim2.new(0.5, 0, 0, 76), CREAM)
toast.AnchorPoint = Vector2.new(0.5, 0)
toast.TextStrokeTransparency = 0
toast.Visible = false
limit(toast, 640, 80)

-- Tells a new player the next step. Hidden for good once they own a better drill.
local hint = label(gui, "", UDim2.new(0.9, 0, 0, 42), UDim2.new(0.5, 0, 1, -64), TEAL)
hint.AnchorPoint = Vector2.new(0.5, 1)
hint.TextStrokeTransparency = 0.3
hint.Visible = false
limit(hint, 640, 42)

-- Shown when the player's data could not be loaded, so nobody grinds a session that will not be kept.
local saveBanner = label(gui, "Saving is not working right now. Progress from this visit will NOT be kept. Try rejoining.",
	UDim2.new(0.9, 0, 0, 52), UDim2.new(0.5, 0, 1, -112), RED)
saveBanner.AnchorPoint = Vector2.new(0.5, 1)
saveBanner.TextStrokeTransparency = 0
saveBanner.Visible = false
limit(saveBanner, 640, 52)

local shopFrame = panel(gui, UDim2.fromScale(0.9, 0.58), UDim2.fromScale(0.5, 0.52), SLATE)
shopFrame.Name = "Shop"
shopFrame.AnchorPoint = Vector2.new(0.5, 0.5)
shopFrame.Visible = false
limit(shopFrame, 520, 380, 240, 230)
label(shopFrame, "UPGRADE WORKSHOP", UDim2.new(1, -70, 0, 45), UDim2.fromOffset(12, 9), CREAM)
local closeButton = button(shopFrame, "X", UDim2.fromOffset(40, 40), UDim2.new(1, -52, 0, 10), ROW)
closeButton.TextColor3 = TEAL

local rows: { [string]: { title: TextLabel, buy: TextButton } } = {}
local function makeRow(kind: string, yScale: number)
	local row = panel(shopFrame, UDim2.new(1, -24, 0.34, 0), UDim2.new(0, 12, yScale, 0), ROW)
	local title = label(row, kind, UDim2.new(1, -16, 0.42, 0), UDim2.fromOffset(8, 2), CREAM)
	local buy = button(row, "UPGRADE", UDim2.new(1, -16, 0.48, 0), UDim2.new(0, 8, 0.46, 0), BUY)
	buy.Activated:Connect(function()
		BuyUpgrade:FireServer(kind)
	end)
	rows[kind] = { title = title, buy = buy }
end
makeRow("Drill", 0.2)
makeRow("Backpack", 0.6)

gui.Parent = player:WaitForChild("PlayerGui")

---------------------------------------------------------------- Live numbers
local function refresh()
	local coins = player:GetAttribute("Coins") or 0
	local drill = player:GetAttribute("Drill") or 1
	local backpack = player:GetAttribute("Backpack") or 1
	local bagCount = player:GetAttribute("BagCount") or 0
	local bagSize = Config.BACKPACKS[backpack].size

	coinsLabel.Text = "COINS  " .. commas(coins)
	bagLabel.Text = `BAG  {bagCount} / {bagSize}`
	bagLabel.TextColor3 = if bagCount >= bagSize then RED else CREAM

	local function fill(kind: string, list: { any }, level: number, field: string, unit: string)
		local row = rows[kind]
		local current, nextItem = list[level], list[level + 1]
		row.title.Text = `{current.name:upper()}  /  {current[field]} {unit}`
		if nextItem then
			row.buy.Text = `{nextItem.name:upper()} ({nextItem[field]} {unit})  -  {commas(nextItem.price)} COINS`
			row.buy.BackgroundColor3 = if coins >= nextItem.price then BUY else MUTED
		else
			row.buy.Text = "MAX LEVEL"
			row.buy.BackgroundColor3 = MUTED
		end
	end
	fill("Drill", Config.DRILLS, drill, "power", "POWER")
	fill("Backpack", Config.BACKPACKS, backpack, "size", "SLOTS")

	saveBanner.Visible = player:GetAttribute("SaveFailed") == true

	local touch = UserInputService.TouchEnabled and not UserInputService.MouseEnabled
	local text: string? = nil
	if not player:GetAttribute("DataReady") or drill > 1 then
		text = nil
	elseif bagCount >= bagSize then
		text = "Bag full! Press SURFACE, then walk onto the SELL pad."
	elseif coins >= Config.DRILLS[2].price then
		text = "You can afford a better drill! Go to the UPGRADES workshop."
	elseif bagCount > 0 then
		text = "Nice! Coloured blocks are ores. Fill your bag, then sell."
	elseif coins == 0 then
		text = if touch then "Walk onto the mine, then tap and hold a block to dig." else "Walk onto the mine, then hold click on a block to dig."
	else
		text = "Dig deeper for better ores. Save up for a new drill."
	end
	hint.Text = text or ""
	hint.Visible = text ~= nil
end
for _, name in { "Coins", "Drill", "Backpack", "BagCount", "DataReady", "SaveFailed" } do
	player:GetAttributeChangedSignal(name):Connect(refresh)
end
refresh()

---------------------------------------------------------------- Popups
local toastToken = 0
local toastTween: Tween? = nil
Notify.OnClientEvent:Connect(function(text: string, big: boolean?, color: Color3?, soundName: string?)
	playSound(soundName)
	toastToken += 1
	local token = toastToken
	if toastTween then
		toastTween:Cancel()
		toastTween = nil
	end
	toast.Text = text
	toast.TextColor3 = color or CREAM
	toast.TextTransparency = 0
	toast.TextStrokeTransparency = 0
	toast.Size = UDim2.new(0.9, 0, 0, if big then 62 else 44)
	toast.Visible = true
	task.delay(if big then 2.5 else 1.2, function()
		if token ~= toastToken then
			return
		end
		local tween = TweenService:Create(toast, TweenInfo.new(0.4), { TextTransparency = 1, TextStrokeTransparency = 1 })
		toastTween = tween
		tween:Play()
		tween.Completed:Wait()
		if token == toastToken then
			toast.Visible = false
		end
	end)
end)

---------------------------------------------------------------- Dig feedback
local debrisRng = Random.new()
local function burst(position: Vector3, color: Color3, count: number)
	for _ = 1, count do
		local chip = Instance.new("Part")
		local size = debrisRng:NextNumber(0.35, 0.8)
		chip.Size = Vector3.new(size, size, size)
		chip.Color = color
		chip.Material = Enum.Material.SmoothPlastic
		chip.CanCollide = false
		chip.CanQuery = false
		chip.CanTouch = false
		chip.CastShadow = false
		chip.Position = position + debrisRng:NextUnitVector() * 1.5
		chip.AssemblyLinearVelocity = Vector3.new(debrisRng:NextNumber(-14, 14), debrisRng:NextNumber(12, 26), debrisRng:NextNumber(-14, 14))
		chip.Parent = workspace
		Debris:AddItem(chip, 0.7)
	end
end

DigResult.OnClientEvent:Connect(function(broke: boolean, position: Vector3, color: Color3, soundName: string?)
	if typeof(position) ~= "Vector3" or typeof(color) ~= "Color3" then
		return
	end
	if soundName then
		playSound(soundName)
		burst(position, color, 14)
	elseif broke then
		playSound("Break")
		burst(position, color, 8)
	else
		playSound("Dig")
		burst(position, color, 2)
	end
end)

---------------------------------------------------------------- Shop and surface
shopPrompt.Triggered:Connect(function()
	shopFrame.Visible = true
end)
closeButton.Activated:Connect(function()
	shopFrame.Visible = false
end)
surfaceButton.Activated:Connect(function()
	ToSurface:FireServer()
end)

---------------------------------------------------------------- Digging
local hover = Instance.new("SelectionBox")
hover.LineThickness = 0.06
hover.Color3 = TEAL
hover.Parent = gui

local TOUCH_DRAG_LIMIT = 30 -- pixels; further than this and the finger is turning the camera, not digging
local holding = false
local activeInput: InputObject? = nil
local touchStart = Vector3.zero
local lastDig = 0

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function stopDigging()
	holding = false
	activeInput = nil
end

local function getRoot(): BasePart?
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

-- The diggable block under the pointer, if it is close enough to dig.
local function getTarget(): BasePart?
	local camera = workspace.CurrentCamera
	local root = getRoot()
	if not camera or not root then
		return nil
	end
	local ray: Ray
	if activeInput and activeInput.UserInputType == Enum.UserInputType.Touch then
		ray = camera:ScreenPointToRay(activeInput.Position.X, activeInput.Position.Y)
	else
		-- GetMouseLocation is in viewport coordinates (it ignores the top-bar inset), matching ViewportPointToRay.
		local m = UserInputService:GetMouseLocation()
		ray = camera:ViewportPointToRay(m.X, m.Y)
	end
	rayParams.FilterDescendantsInstances = { player.Character :: Instance }
	local result = workspace:Raycast(ray.Origin, ray.Direction * 300, rayParams)
	local part = result and result.Instance
	while part and part.Parent ~= blocksFolder and part.Parent ~= meteorsFolder and part.Parent ~= workspace and part.Parent ~= nil do
		part = part.Parent -- a decorated block template may have child parts
	end
	if part and part:IsA("BasePart") and (part.Parent == blocksFolder or part.Parent == meteorsFolder)
		and (root.Position - part.Position).Magnitude <= Config.REACH - 1
	then
		return part
	end
	return nil
end

UserInputService.InputBegan:Connect(function(input: InputObject, processed: boolean)
	if processed or shopFrame.Visible then
		return
	end
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		holding = true
		activeInput = input
	elseif input.UserInputType == Enum.UserInputType.Touch and not activeInput then
		-- Only the first finger digs; a second finger (camera, pinch) never takes over.
		holding = true
		activeInput = input
		touchStart = input.Position
	end
end)
UserInputService.InputEnded:Connect(function(input: InputObject)
	if input == activeInput or input.UserInputType == Enum.UserInputType.MouseButton1 then
		stopDigging()
	end
end)
UserInputService.WindowFocusReleased:Connect(stopDigging)

RunService.Heartbeat:Connect(function()
	local root = getRoot()
	local y = if root then root.Position.Y else 0
	local depth = math.max(0, math.floor(-y / Config.BLOCK_SIZE))
	depthLabel.Text = "DEPTH  " .. depth
	surfaceButton.Visible = y < -3

	if shopFrame.Visible then
		stopDigging()
	elseif activeInput and activeInput.UserInputType == Enum.UserInputType.Touch
		and (activeInput.Position - touchStart).Magnitude > TOUCH_DRAG_LIMIT
	then
		stopDigging()
	end

	local target = if holding or UserInputService.MouseEnabled then getTarget() else nil
	hover.Adornee = if UserInputService.MouseEnabled and not shopFrame.Visible then target else nil
	if holding and target and os.clock() - lastDig >= Config.DIG_COOLDOWN then
		lastDig = os.clock()
		DigBlock:FireServer(target)
	end
end)

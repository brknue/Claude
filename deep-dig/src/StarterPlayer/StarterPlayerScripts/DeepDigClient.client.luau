-- Deep Dig client: input, on-screen display, shop window and popups. Asks the server for everything.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")
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
local shopPrompt = world:WaitForChild("Shop"):WaitForChild("ShopPrompt") :: ProximityPrompt

local FONT = Enum.Font.FredokaOne
local DARK = Color3.fromRGB(24, 26, 34)

---------------------------------------------------------------- GUI helpers
local function corner(parent: Instance, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local function label(parent: Instance, text: string, size: UDim2, pos: UDim2): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Size = size
	l.Position = pos
	l.Font = FONT
	l.Text = text
	l.TextColor3 = Color3.new(1, 1, 1)
	l.TextScaled = true
	l.Parent = parent
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0, 6)
	pad.PaddingBottom = UDim.new(0, 6)
	pad.PaddingLeft = UDim.new(0, 8)
	pad.PaddingRight = UDim.new(0, 8)
	pad.Parent = l
	return l
end

local function button(parent: Instance, text: string, size: UDim2, pos: UDim2, color: Color3): TextButton
	local b = Instance.new("TextButton")
	b.Size = size
	b.Position = pos
	b.BackgroundColor3 = color
	b.AutoButtonColor = true
	b.Font = FONT
	b.Text = text
	b.TextColor3 = Color3.new(1, 1, 1)
	b.TextScaled = true
	b.Parent = parent
	corner(b, 10)
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0, 6)
	pad.PaddingBottom = UDim.new(0, 6)
	pad.PaddingLeft = UDim.new(0, 8)
	pad.PaddingRight = UDim.new(0, 8)
	pad.Parent = b
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

-- One UIScale keeps everything readable from phones to desktops.
local uiScale = Instance.new("UIScale")
uiScale.Parent = gui
local function updateScale()
	local camera = workspace.CurrentCamera
	if camera then
		uiScale.Scale = math.clamp(camera.ViewportSize.Y / 720, 0.55, 1.25)
	end
end
updateScale()
if workspace.CurrentCamera then
	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(updateScale)
end

local hud = Instance.new("Frame")
hud.Name = "Hud"
hud.AnchorPoint = Vector2.new(0.5, 0)
hud.Position = UDim2.new(0.5, 0, 0, 8)
hud.Size = UDim2.fromOffset(480, 48)
hud.BackgroundColor3 = DARK
hud.BackgroundTransparency = 0.25
hud.Parent = gui
corner(hud, 12)
local coinsLabel = label(hud, "Coins: 0", UDim2.fromScale(0.36, 1), UDim2.fromScale(0, 0))
coinsLabel.TextColor3 = Color3.fromRGB(255, 215, 70)
local bagLabel = label(hud, "Bag: 0/20", UDim2.fromScale(0.32, 1), UDim2.fromScale(0.36, 0))
local depthLabel = label(hud, "Depth: 0", UDim2.fromScale(0.32, 1), UDim2.fromScale(0.68, 0))
depthLabel.TextColor3 = Color3.fromRGB(150, 210, 255)

local surfaceButton = button(gui, "SURFACE", UDim2.fromOffset(150, 52), UDim2.new(1, -166, 0.5, -26), Color3.fromRGB(60, 170, 90))
surfaceButton.Visible = false

local toast = label(gui, "", UDim2.fromOffset(560, 54), UDim2.new(0.5, -280, 0, 70))
toast.TextStrokeTransparency = 0
toast.Visible = false

-- Tells a new player the next step. Hidden for good once they own a better drill.
local hint = label(gui, "", UDim2.fromOffset(640, 46), UDim2.new(0.5, -320, 0.74, 0))
hint.TextStrokeTransparency = 0.2
hint.TextColor3 = Color3.fromRGB(255, 240, 170)
hint.Visible = false

local shopFrame = Instance.new("Frame")
shopFrame.Name = "Shop"
shopFrame.AnchorPoint = Vector2.new(0.5, 0.5)
shopFrame.Position = UDim2.fromScale(0.5, 0.5)
shopFrame.Size = UDim2.fromOffset(460, 300)
shopFrame.BackgroundColor3 = DARK
shopFrame.Visible = false
shopFrame.Parent = gui
corner(shopFrame, 16)
label(shopFrame, "UPGRADES", UDim2.new(1, -70, 0, 50), UDim2.fromOffset(10, 8))
local closeButton = button(shopFrame, "X", UDim2.fromOffset(44, 44), UDim2.new(1, -54, 0, 10), Color3.fromRGB(210, 70, 70))

local rows: { [string]: { title: TextLabel, buy: TextButton } } = {}
local function makeRow(kind: string, y: number)
	local row = Instance.new("Frame")
	row.Size = UDim2.new(1, -24, 0, 100)
	row.Position = UDim2.fromOffset(12, y)
	row.BackgroundColor3 = Color3.fromRGB(40, 44, 58)
	row.Parent = shopFrame
	corner(row, 12)
	local title = label(row, kind, UDim2.new(1, -12, 0, 44), UDim2.fromOffset(6, 2))
	title.TextXAlignment = Enum.TextXAlignment.Left
	local buy = button(row, "Buy", UDim2.new(1, -16, 0, 46), UDim2.fromOffset(8, 48), Color3.fromRGB(60, 150, 255))
	buy.Activated:Connect(function()
		BuyUpgrade:FireServer(kind)
	end)
	rows[kind] = { title = title, buy = buy }
end
makeRow("Drill", 68)
makeRow("Backpack", 180)

gui.Parent = player:WaitForChild("PlayerGui")

---------------------------------------------------------------- Live numbers
local function refresh()
	local coins = player:GetAttribute("Coins") or 0
	local drill = player:GetAttribute("Drill") or 1
	local backpack = player:GetAttribute("Backpack") or 1
	local bagCount = player:GetAttribute("BagCount") or 0
	local bagSize = Config.BACKPACKS[backpack].size

	coinsLabel.Text = "Coins: " .. commas(coins)
	bagLabel.Text = `Bag: {bagCount}/{bagSize}`
	bagLabel.TextColor3 = if bagCount >= bagSize then Color3.fromRGB(255, 110, 110) else Color3.new(1, 1, 1)

	local function fill(kind: string, list: { any }, level: number, stat: string)
		local row = rows[kind]
		local current, nextItem = list[level], list[level + 1]
		row.title.Text = `{current.name} ({stat} {current[if kind == "Drill" then "power" else "size"]})`
		if nextItem then
			local value = nextItem[if kind == "Drill" then "power" else "size"]
			row.buy.Text = `{nextItem.name} ({stat} {value}) - {commas(nextItem.price)} coins`
			row.buy.BackgroundColor3 = if coins >= nextItem.price then Color3.fromRGB(60, 170, 90) else Color3.fromRGB(90, 95, 110)
		else
			row.buy.Text = "MAX LEVEL"
			row.buy.BackgroundColor3 = Color3.fromRGB(90, 95, 110)
		end
	end
	fill("Drill", Config.DRILLS, drill, "power")
	fill("Backpack", Config.BACKPACKS, backpack, "slots")

	local touch = UserInputService.TouchEnabled and not UserInputService.MouseEnabled
	local text: string? = nil
	if not player:GetAttribute("DataReady") or drill > 1 then
		text = nil
	elseif bagCount >= bagSize then
		text = "Bag full! Press SURFACE, then walk onto the yellow SELL pad."
	elseif coins >= Config.DRILLS[2].price then
		text = "You can afford a better drill! Go to the blue UPGRADES shop."
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
for _, name in { "Coins", "Drill", "Backpack", "BagCount", "DataReady" } do
	player:GetAttributeChangedSignal(name):Connect(refresh)
end
refresh()

---------------------------------------------------------------- Popups
local toastToken = 0
Notify.OnClientEvent:Connect(function(text: string, big: boolean?, color: Color3?, soundName: string?)
	playSound(soundName)
	toastToken += 1
	local token = toastToken
	toast.Text = text
	toast.TextColor3 = color or Color3.new(1, 1, 1)
	toast.TextTransparency = 0
	toast.TextStrokeTransparency = 0
	toast.Size = if big then UDim2.fromOffset(640, 70) else UDim2.fromOffset(520, 46)
	toast.Position = UDim2.new(0.5, -toast.Size.X.Offset / 2, 0, 70)
	toast.Visible = true
	task.delay(if big then 2.5 else 1.2, function()
		if token ~= toastToken then
			return
		end
		local tween = TweenService:Create(toast, TweenInfo.new(0.4), { TextTransparency = 1, TextStrokeTransparency = 1 })
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
hover.Color3 = Color3.new(1, 1, 1)
hover.Parent = gui

local holding = false
local activeInput: InputObject? = nil
local lastDig = 0

local function getRoot(): BasePart?
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

-- The mine block under the pointer, if it is close enough to dig.
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
		local m = UserInputService:GetMouseLocation()
		ray = camera:ViewportPointToRay(m.X, m.Y)
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { player.Character :: Instance }
	local result = workspace:Raycast(ray.Origin, ray.Direction * 300, params)
	local part = result and result.Instance
	if part and (part.Parent == blocksFolder or part.Parent == meteorsFolder) and (root.Position - part.Position).Magnitude <= Config.REACH - 1 then
		return part
	end
	return nil
end

UserInputService.InputBegan:Connect(function(input: InputObject, processed: boolean)
	if processed then
		return
	end
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
		holding = true
		activeInput = input
	end
end)
UserInputService.InputEnded:Connect(function(input: InputObject)
	if input == activeInput or input.UserInputType == Enum.UserInputType.MouseButton1 then
		holding = false
		activeInput = nil
	end
end)

RunService.Heartbeat:Connect(function()
	local root = getRoot()
	local y = if root then root.Position.Y else 0
	local depth = math.max(0, math.floor(-y / Config.BLOCK_SIZE))
	depthLabel.Text = "Depth: " .. depth
	surfaceButton.Visible = y < -3

	local target = if holding or UserInputService.MouseEnabled then getTarget() else nil
	hover.Adornee = if UserInputService.MouseEnabled then target else nil
	if holding and target and os.clock() - lastDig >= Config.DIG_COOLDOWN then
		lastDig = os.clock()
		DigBlock:FireServer(target)
	end
end)

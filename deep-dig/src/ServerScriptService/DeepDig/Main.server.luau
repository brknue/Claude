-- Deep Dig server: every dig, sale and purchase is decided here, never on the client.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local shared = ReplicatedStorage:WaitForChild("DeepDig")
local Config = require(shared:WaitForChild("Config"))
local Remotes = shared:WaitForChild("Remotes")
local PlayerData = require(script.Parent:WaitForChild("PlayerData"))
local Mine = require(script.Parent:WaitForChild("Mine"))

local world = workspace:WaitForChild("DeepDig")
local sellPad = world:WaitForChild("SellPad") :: BasePart
local shop = world:WaitForChild("Shop") :: BasePart
local meteorsFolder = world:WaitForChild("Meteors")

local DigBlock = Remotes:WaitForChild("DigBlock") :: RemoteEvent
local BuyUpgrade = Remotes:WaitForChild("BuyUpgrade") :: RemoteEvent
local ToSurface = Remotes:WaitForChild("ToSurface") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent
local DigResult = Remotes:WaitForChild("DigResult") :: RemoteEvent

local rng = Random.new()
local GOLD = Color3.fromRGB(255, 215, 70)

-- Per-player timestamps for rate limiting, keyed by action name.
local lastAction: { [Player]: { [string]: number } } = {}

local function allow(player: Player, action: string, interval: number): boolean
	local times = lastAction[player]
	if not times then
		times = {}
		lastAction[player] = times
	end
	local now = os.clock()
	if now - (times[action] or 0) < interval then
		return false
	end
	times[action] = now
	return true
end

local function getRoot(player: Player): BasePart?
	local character = player.Character
	if not character then
		return nil
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	local root = character:FindFirstChild("HumanoidRootPart")
	if humanoid and humanoid.Health > 0 and root and root:IsA("BasePart") then
		return root
	end
	return nil
end

local function toSurface(player: Player)
	local character = player.Character
	if character and getRoot(player) then
		character:PivotTo(CFrame.new(Config.SURFACE_POINT))
	end
end

---------------------------------------------------------------- Digging
DigBlock.OnServerEvent:Connect(function(player: Player, part: any)
	if typeof(part) ~= "Instance" then
		return
	end
	local block = Mine.get(part)
	local data = PlayerData.get(player)
	local root = getRoot(player)
	if not block or not data or not root then
		return
	end
	local position = (part :: BasePart).Position
	if (root.Position - position).Magnitude > Config.REACH then
		return
	end
	if not allow(player, "dig", Config.DIG_COOLDOWN * 0.8) then
		return
	end
	local oreName = block.ore
	if oreName and PlayerData.bagCount(player) >= Config.BACKPACKS[data.backpack].size then
		if allow(player, "fullMsg", 2) then
			Notify:FireClient(player, "Backpack full! Go up and sell.", false, nil, "Error")
		end
		return
	end
	local color = block.baseColor
	local healthBefore = block.health
	local broke = Mine.damage(part, Config.DRILLS[data.drill].power)
	if not broke and block.health == healthBefore then
		return -- mine is refilling; nothing happened
	end
	DigResult:FireClient(player, broke, position, color)
	if not broke then
		return
	end
	PlayerData.funnel(player, 2)
	if oreName then
		data.inventory[oreName] = (data.inventory[oreName] or 0) + 1
		PlayerData.sync(player)
		PlayerData.funnel(player, 3)
		local ore = Config.ORES[oreName]
		if ore.rare then
			Notify:FireClient(player, `RARE FIND! {oreName} (worth {ore.value})`, true, ore.color, "RareFind")
		else
			Notify:FireClient(player, `+1 {oreName}`, false, ore.color, "OreGet")
		end
	end
end)

---------------------------------------------------------------- Selling
sellPad.Touched:Connect(function(hit: BasePart)
	local character = hit.Parent
	local player = character and Players:GetPlayerFromCharacter(character)
	if not player then
		return
	end
	local data = PlayerData.get(player)
	if not data or not getRoot(player) or next(data.inventory) == nil then
		return
	end
	if not allow(player, "sell", 1) then
		return
	end
	local total, count = 0, 0
	for name, amount in data.inventory do
		local ore = Config.ORES[name]
		if ore then
			total += ore.value * amount
			count += amount
		end
	end
	table.clear(data.inventory)
	data.coins += total
	PlayerData.sync(player)
	PlayerData.funnel(player, 4)
	Notify:FireClient(player, `Sold {count} ores for {total} coins!`, true, GOLD, "Sell")
end)

---------------------------------------------------------------- Upgrades
BuyUpgrade.OnServerEvent:Connect(function(player: Player, kind: any)
	if kind ~= "Drill" and kind ~= "Backpack" then
		return
	end
	local data = PlayerData.get(player)
	local root = getRoot(player)
	if not data or not root or not allow(player, "buy", 0.3) then
		return
	end
	if (root.Position - shop.Position).Magnitude > Config.SHOP_RANGE then
		return
	end
	local list = if kind == "Drill" then Config.DRILLS else Config.BACKPACKS
	local field = if kind == "Drill" then "drill" else "backpack"
	local item = list[data[field] + 1]
	if not item then
		return
	end
	if data.coins < item.price then
		Notify:FireClient(player, `You need {item.price - data.coins} more coins.`, false, nil, "Error")
		return
	end
	data.coins -= item.price
	data[field] += 1
	PlayerData.sync(player)
	PlayerData.funnel(player, 5)
	Notify:FireClient(player, `Bought {item.name}!`, true, Color3.fromRGB(120, 220, 255), "Buy")
end)

ToSurface.OnServerEvent:Connect(function(player: Player)
	if allow(player, "surface", 2) then
		toSurface(player)
	end
end)

---------------------------------------------------------------- Players
local function onCharacter(character: Model)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if root and not root:FindFirstChild("MinerLight") then
		local light = Instance.new("PointLight")
		light.Name = "MinerLight"
		light.Range = 30
		light.Brightness = 1.3
		light.Parent = root
	end
end

local function onPlayer(player: Player)
	player.CharacterAdded:Connect(onCharacter)
	if player.Character then
		task.spawn(onCharacter, player.Character)
	end
	PlayerData.load(player)
	PlayerData.funnel(player, 1)
end

Players.PlayerAdded:Connect(onPlayer)
Players.PlayerRemoving:Connect(function(player: Player)
	lastAction[player] = nil
	PlayerData.release(player)
end)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayer, player)
end
PlayerData.start()

---------------------------------------------------------------- Mine refill
local function insideMine(position: Vector3): boolean
	local o = Config.MINE_ORIGIN
	local size = Config.MINE_WIDTH * Config.BLOCK_SIZE
	return position.Y < o.Y - 1
		and position.X > o.X - 4 and position.X < o.X + size + 4
		and position.Z > o.Z - 4 and position.Z < o.Z + size + 4
end

local refilling = false
local function refill(warningSeconds: number)
	if refilling then
		return
	end
	refilling = true
	if warningSeconds > 0 then
		Notify:FireAllClients(`The mine refills in {warningSeconds} seconds!`, true)
		task.wait(warningSeconds)
	end
	for _, player in Players:GetPlayers() do
		local root = getRoot(player)
		if root and insideMine(root.Position) then
			toSurface(player)
		end
	end
	Mine.generate()
	Notify:FireAllClients("The mine has been refilled!", false)
	refilling = false
end

---------------------------------------------------------------- Meteor shower
local showerActive = false

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

local function landingSpot(): Vector3?
	local area = Config.METEOR.area
	for _ = 1, 20 do
		local spot = Vector3.new(rng:NextNumber(area.minX, area.maxX), 0, rng:NextNumber(area.minZ, area.maxZ))
		if (spot - flat(sellPad.Position)).Magnitude > 14
			and (spot - flat(shop.Position)).Magnitude > 14
			and (spot - flat(Config.SURFACE_POINT)).Magnitude > 12
		then
			return spot
		end
	end
	return nil
end

local function makeMeteor(): BasePart
	local template = Mine.template("Meteorite")
	if template then
		template.Name = "Meteorite"
		return template
	end
	local meteor = Instance.new("Part")
	meteor.Name = "Meteorite"
	meteor.Shape = Enum.PartType.Ball
	meteor.Size = Vector3.new(6, 6, 6)
	meteor.Anchored = true
	meteor.Material = Enum.Material.Neon
	meteor.Color = Color3.fromRGB(255, 140, 40)
	local light = Instance.new("PointLight")
	light.Color = meteor.Color
	light.Range = 18
	light.Brightness = 2
	light.Parent = meteor
	local fire = Instance.new("Fire")
	fire.Size = 8
	fire.Heat = 12
	fire.Parent = meteor
	return meteor
end

local function meteorShower()
	if showerActive then
		return
	end
	showerActive = true
	local settings = Config.METEOR
	Notify:FireAllClients("METEOR SHOWER incoming! Get to the surface!", true, Color3.fromRGB(255, 170, 60), "MeteorWarning")
	task.wait(settings.warning)
	local landed: { BasePart } = {}
	for _ = 1, settings.count do
		local spot = landingSpot()
		if spot then
			local meteor = makeMeteor()
			local rest = spot + Vector3.new(0, meteor.Size.Y / 2 - 1, 0)
			meteor.Position = rest + Vector3.new(rng:NextNumber(-50, 50), 230, rng:NextNumber(-50, 50))
			meteor.Parent = meteorsFolder
			local tween = TweenService:Create(meteor, TweenInfo.new(1.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = rest })
			tween.Completed:Once(function()
				if meteor.Parent then
					Mine.addLoose(meteor, settings.health, settings.ore)
					DigResult:FireAllClients(true, rest, meteor.Color, "MeteorLand")
				end
			end)
			tween:Play()
			table.insert(landed, meteor)
		end
		task.wait(0.4)
	end
	Notify:FireAllClients("Meteorites have landed! Dig them for Star Shards.", true, Config.ORES[settings.ore].color)
	task.wait(settings.lifetime)
	for _, meteor in landed do
		if meteor.Parent then
			Mine.removeLoose(meteor)
			meteor:Destroy()
		end
	end
	showerActive = false
end

-- Studio-only test switches: set an attribute on Workspace.DeepDig to trigger an event right away.
if RunService:IsStudio() then
	world:GetAttributeChangedSignal("DebugMeteor"):Connect(function()
		task.spawn(meteorShower)
	end)
	world:GetAttributeChangedSignal("DebugRefill"):Connect(function()
		task.spawn(refill, 0)
	end)
end

task.spawn(function()
	while true do
		task.wait(Config.METEOR.interval)
		meteorShower()
	end
end)

Mine.generate()
while true do
	task.wait(Config.REFILL_SECONDS - 10)
	refill(10)
end

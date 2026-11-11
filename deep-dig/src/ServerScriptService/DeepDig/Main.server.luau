-- Deep Dig server: every dig, sale and purchase is decided here, never on the client.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local shared = ReplicatedStorage:WaitForChild("DeepDig")
local Config = require(shared:WaitForChild("Config"))
local Remotes = shared:WaitForChild("Remotes")
local PlayerData = require(script.Parent:WaitForChild("PlayerData"))
local Mine = require(script.Parent:WaitForChild("Mine"))

local world = workspace:WaitForChild("DeepDig")
local sellPad = world:WaitForChild("SellPad") :: BasePart
local shop = world:WaitForChild("Shop") :: BasePart

local DigBlock = Remotes:WaitForChild("DigBlock") :: RemoteEvent
local BuyUpgrade = Remotes:WaitForChild("BuyUpgrade") :: RemoteEvent
local ToSurface = Remotes:WaitForChild("ToSurface") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

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

DigBlock.OnServerEvent:Connect(function(player: Player, part: any)
	if typeof(part) ~= "Instance" then
		return
	end
	local block = Mine.get(part)
	local data = PlayerData.get(player)
	local root = getRoot(player)
	if not block or not data or not root or Mine.isLocked() then
		return
	end
	if (root.Position - (part :: BasePart).Position).Magnitude > Config.REACH then
		return
	end
	if not allow(player, "dig", Config.DIG_COOLDOWN * 0.8) then
		return
	end
	local oreName = block.ore
	if oreName and PlayerData.bagCount(player) >= Config.BACKPACKS[data.backpack].size then
		if allow(player, "fullMsg", 2) then
			Notify:FireClient(player, "Backpack full! Go up and sell.", false)
		end
		return
	end
	local broke = Mine.damage(part, Config.DRILLS[data.drill].power)
	if broke and oreName then
		data.inventory[oreName] = (data.inventory[oreName] or 0) + 1
		PlayerData.sync(player)
		local ore = Config.ORES[oreName]
		if ore.rare then
			Notify:FireClient(player, `RARE FIND! {oreName} (worth {ore.value})`, true, ore.color)
		else
			Notify:FireClient(player, `+1 {oreName}`, false, ore.color)
		end
	end
end)

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
	Notify:FireClient(player, `Sold {count} ores for {total} coins!`, true, Color3.fromRGB(255, 215, 70))
end)

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
		Notify:FireClient(player, `You need {item.price - data.coins} more coins.`, false)
		return
	end
	data.coins -= item.price
	data[field] += 1
	PlayerData.sync(player)
	Notify:FireClient(player, `Bought {item.name}!`, true, Color3.fromRGB(120, 220, 255))
end)

ToSurface.OnServerEvent:Connect(function(player: Player)
	if allow(player, "surface", 2) then
		toSurface(player)
	end
end)

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

local function insideMine(position: Vector3): boolean
	local o = Config.MINE_ORIGIN
	local size = Config.MINE_WIDTH * Config.BLOCK_SIZE
	return position.Y < o.Y - 1
		and position.X > o.X - 4 and position.X < o.X + size + 4
		and position.Z > o.Z - 4 and position.Z < o.Z + size + 4
end

Mine.generate()
while true do
	task.wait(Config.REFILL_SECONDS - 10)
	Notify:FireAllClients("The mine refills in 10 seconds!", true)
	task.wait(10)
	for _, player in Players:GetPlayers() do
		local root = getRoot(player)
		if root and insideMine(root.Position) then
			toSurface(player)
		end
	end
	Mine.generate()
	Notify:FireAllClients("The mine has been refilled!", false)
end

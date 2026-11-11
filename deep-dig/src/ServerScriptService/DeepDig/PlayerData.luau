-- Loads, saves and mirrors player progress. Never saves if the load failed.
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Config = require(ReplicatedStorage:WaitForChild("DeepDig"):WaitForChild("Config"))

local PlayerData = {}

local STORE_NAME = "DeepDig_v1"
local AUTOSAVE_SECONDS = 120

local store: DataStore? = nil
pcall(function()
	store = DataStoreService:GetDataStore(STORE_NAME)
end)

local profiles: { [Player]: { data: any, loaded: boolean } } = {}

local function defaults()
	return { coins = 0, drill = 1, backpack = 1, inventory = {} }
end

local function sanitize(raw: any)
	local data = defaults()
	if typeof(raw) ~= "table" then
		return data
	end
	if typeof(raw.coins) == "number" and raw.coins == raw.coins then
		data.coins = math.max(0, math.floor(raw.coins))
	end
	if typeof(raw.drill) == "number" then
		data.drill = math.clamp(math.floor(raw.drill), 1, #Config.DRILLS)
	end
	if typeof(raw.backpack) == "number" then
		data.backpack = math.clamp(math.floor(raw.backpack), 1, #Config.BACKPACKS)
	end
	if typeof(raw.inventory) == "table" then
		for name, count in raw.inventory do
			if Config.ORES[name] and typeof(count) == "number" and count > 0 then
				data.inventory[name] = math.floor(count)
			end
		end
	end
	return data
end

local function withRetry(fn: () -> any): (boolean, any)
	local attempts = if RunService:IsStudio() then 1 else 3
	local lastErr: any = nil
	for attempt = 1, attempts do
		local ok, result = pcall(fn)
		if ok then
			return true, result
		end
		lastErr = result
		if attempt < attempts then
			task.wait(attempt * 2)
		end
	end
	return false, lastErr
end

function PlayerData.get(player: Player)
	local profile = profiles[player]
	return profile and profile.data
end

function PlayerData.bagCount(player: Player): number
	local data = PlayerData.get(player)
	local total = 0
	if data then
		for _, count in data.inventory do
			total += count
		end
	end
	return total
end

-- Pushes the current numbers to attributes (read by the client HUD) and leaderstats.
function PlayerData.sync(player: Player)
	local data = PlayerData.get(player)
	if not data then
		return
	end
	player:SetAttribute("Coins", data.coins)
	player:SetAttribute("Drill", data.drill)
	player:SetAttribute("Backpack", data.backpack)
	player:SetAttribute("BagCount", PlayerData.bagCount(player))
	local stats = player:FindFirstChild("leaderstats")
	local coins = stats and stats:FindFirstChild("Coins")
	if coins and coins:IsA("IntValue") then
		coins.Value = data.coins
	end
end

function PlayerData.load(player: Player)
	local ok, result = false, nil
	if store then
		local s = store
		ok, result = withRetry(function()
			return s:GetAsync("p_" .. player.UserId)
		end)
	end
	if not ok then
		warn(`[DeepDig] Could not load data for {player.Name}; progress will not be saved this session. {result}`)
	end
	if not player:IsDescendantOf(Players) then
		return
	end
	profiles[player] = { data = sanitize(if ok then result else nil), loaded = ok }

	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
	stats.Parent = player
	PlayerData.sync(player)
	player:SetAttribute("DataReady", true)
end

function PlayerData.save(player: Player)
	local profile = profiles[player]
	if not profile or not profile.loaded or not store then
		return
	end
	local s, data = store, profile.data
	local ok, err = withRetry(function()
		return s:SetAsync("p_" .. player.UserId, data)
	end)
	if not ok then
		warn(`[DeepDig] Save failed for {player.Name}: {err}`)
	end
end

function PlayerData.release(player: Player)
	PlayerData.save(player)
	profiles[player] = nil
end

function PlayerData.start()
	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_SECONDS)
			for player in profiles do
				task.spawn(PlayerData.save, player)
			end
		end
	end)
	game:BindToClose(function()
		local pending = 0
		for player in profiles do
			pending += 1
			task.spawn(function()
				PlayerData.save(player)
				pending -= 1
			end)
		end
		local deadline = os.clock() + 20
		while pending > 0 and os.clock() < deadline do
			task.wait(0.1)
		end
	end)
end

return PlayerData

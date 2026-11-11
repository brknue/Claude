-- Loads, saves and mirrors player progress.
-- Safety rules: never save after a failed load; one server owns a player's record at a time (session lock);
-- all writes go through UpdateAsync so a stale server cannot overwrite a newer one.
local AnalyticsService = game:GetService("AnalyticsService")
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Config = require(ReplicatedStorage:WaitForChild("DeepDig"):WaitForChild("Config"))

local PlayerData = {}

local STORE_NAME = "DeepDig_v1"
local DATA_VERSION = 1
local AUTOSAVE_SECONDS = 120
local JOB_ID = game.JobId
local USE_LOCK = JOB_ID ~= "" -- Studio has no JobId, so locking is skipped there

local store: DataStore? = nil
pcall(function()
	store = DataStoreService:GetDataStore(STORE_NAME)
end)

type Profile = { data: any, loaded: boolean, saving: boolean, failures: number }
local profiles: { [Player]: Profile } = {}
-- Profiles whose final save failed. Kept in memory and retried so the progress is not silently dropped.
-- (Memory only: a server crash still loses them.)
local pending: { [number]: Profile } = {}
local PENDING_RETRY_SECONDS = 20
local PENDING_MAX_FAILURES = 15

local function finite(n: any): boolean
	return typeof(n) == "number" and n == n and n > -math.huge and n < math.huge
end

local function defaults()
	return { coins = 0, drill = 1, backpack = 1, inventory = {}, funnel = 0 }
end

local function sanitize(raw: any)
	local data = defaults()
	if typeof(raw) ~= "table" then
		return data
	end
	if finite(raw.coins) then
		data.coins = math.max(0, math.floor(raw.coins))
	end
	if finite(raw.drill) then
		data.drill = math.clamp(math.floor(raw.drill), 1, #Config.DRILLS)
	end
	if finite(raw.backpack) then
		data.backpack = math.clamp(math.floor(raw.backpack), 1, #Config.BACKPACKS)
	end
	if finite(raw.funnel) then
		data.funnel = math.clamp(math.floor(raw.funnel), 0, #Config.FUNNEL)
	end
	if typeof(raw.inventory) == "table" then
		for name, count in raw.inventory do
			if Config.ORES[name] and finite(count) and count > 0 then
				data.inventory[name] = math.min(math.floor(count), 100000)
			end
		end
	end
	return data
end

-- Stored record: { v = 1, data = {...}, lock = { jobId, t }? }. Records written before versioning are the bare data table.
local function unpackRecord(raw: any): (any, any)
	if typeof(raw) ~= "table" then
		return nil, nil
	end
	if raw.v ~= nil and typeof(raw.data) == "table" then
		return raw.data, raw.lock
	end
	return raw, nil
end

local function lockedElsewhere(lock: any): boolean
	return USE_LOCK
		and typeof(lock) == "table"
		and lock.jobId ~= JOB_ID
		and typeof(lock.t) == "number"
		and os.time() - lock.t < Config.SESSION_LOCK_SECONDS
end

local function newLock(): any
	return if USE_LOCK then { jobId = JOB_ID, t = os.time() } else nil
end

local function keyFor(userId: number): string
	return "p_" .. userId
end

-- Returns "ok" + data, "locked", or "error" + message.
local function tryLoad(userId: number): (string, any)
	local s = store
	if not s then
		return "error", "DataStore unavailable"
	end
	local blocked = false
	local ok, result = pcall(function()
		return s:UpdateAsync(keyFor(userId), function(raw)
			local data, lock = unpackRecord(raw)
			if lockedElsewhere(lock) then
				blocked = true
				return nil
			end
			blocked = false
			return { v = DATA_VERSION, data = sanitize(data), lock = newLock() }
		end)
	end)
	if not ok then
		return "error", result
	end
	if blocked then
		return "locked", nil
	end
	return "ok", if typeof(result) == "table" then result.data else nil
end

-- Returns true when the record is safely stored (or there is nothing that may be stored).
local function saveProfile(userId: number, profile: Profile, releasing: boolean): boolean
	local s = store
	if not profile.loaded or not s then
		return true
	end
	local saved = false
	while profile.saving do
		task.wait(0.1)
	end
	profile.saving = true
	local attempts = if RunService:IsStudio() then 1 else 3
	for attempt = 1, attempts do
		local ok, err = pcall(function()
			s:UpdateAsync(keyFor(userId), function(raw)
				local _, lock = unpackRecord(raw)
				if lockedElsewhere(lock) then
					return nil -- another server owns this record now; do not overwrite it
				end
				return { v = DATA_VERSION, data = profile.data, lock = if releasing then nil else newLock() }
			end)
		end)
		if ok then
			saved = true
			break
		end
		warn(`[DeepDig] Save attempt {attempt} failed for {userId}: {err}`)
		if attempt < attempts then
			task.wait(attempt * 2)
		end
	end
	profile.saving = false
	return saved
end

local function install(player: Player, profile: Profile)
	profiles[player] = profile
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
	stats.Parent = player
	PlayerData.sync(player)
	player:SetAttribute("SaveFailed", not profile.loaded)
	player:SetAttribute("DataReady", true)
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

-- Logs an onboarding funnel step once per player, ever.
function PlayerData.funnel(player: Player, step: number)
	local data = PlayerData.get(player)
	if not data or data.funnel >= step or not Config.FUNNEL[step] then
		return
	end
	data.funnel = step
	pcall(function()
		AnalyticsService:LogOnboardingFunnelStepEvent(player, step, Config.FUNNEL[step])
	end)
end

function PlayerData.load(player: Player)
	-- Rejoined this same server while their last save was still stuck: carry on from the in-memory copy.
	local kept = pending[player.UserId]
	if kept then
		pending[player.UserId] = nil
		while kept.saving do
			task.wait(0.1)
		end
		if player:IsDescendantOf(Players) then
			install(player, kept)
		else
			pending[player.UserId] = kept
		end
		return
	end
	local status, result = "error", nil
	local maxTries = if RunService:IsStudio() then 1 else 5
	for attempt = 1, maxTries do
		status, result = tryLoad(player.UserId)
		if status == "ok" or not player:IsDescendantOf(Players) then
			break
		end
		if attempt < maxTries then
			task.wait(if status == "locked" then 6 else attempt * 2)
		end
	end
	if not player:IsDescendantOf(Players) then
		return
	end
	if status == "locked" then
		player:Kick("Your progress is still saving on another server. Please rejoin in a minute.")
		return
	end
	if status ~= "ok" then
		warn(`[DeepDig] Could not load data for {player.Name}; progress will not be saved this session. {result}`)
	end
	install(player, { data = sanitize(if status == "ok" then result else nil), loaded = status == "ok", saving = false, failures = 0 })
end

function PlayerData.release(player: Player)
	local profile = profiles[player]
	if profile then
		profiles[player] = nil
		if not saveProfile(player.UserId, profile, true) then
			pending[player.UserId] = profile
			warn(`[DeepDig] Final save failed for {player.UserId}; keeping it in memory and retrying.`)
		end
	end
end

function PlayerData.start()
	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_SECONDS)
			for player, profile in profiles do
				task.spawn(saveProfile, player.UserId, profile, false)
				task.wait(1) -- stagger writes
			end
		end
	end)
	-- Keep retrying final saves that failed, for a bounded number of tries.
	task.spawn(function()
		while true do
			task.wait(PENDING_RETRY_SECONDS)
			local ids = {}
			for userId in pending do
				table.insert(ids, userId)
			end
			for _, userId in ids do
				local profile = pending[userId]
				if profile then
					if saveProfile(userId, profile, true) then
						if pending[userId] == profile then
							pending[userId] = nil
						end
					else
						profile.failures += 1
						if profile.failures >= PENDING_MAX_FAILURES and pending[userId] == profile then
							pending[userId] = nil
							warn(`[DeepDig] DATA LOSS: gave up saving {userId} after {profile.failures} retries.`)
						end
					end
				end
			end
		end
	end)
	game:BindToClose(function()
		local waiting = 0
		local function flush(userId: number, profile: Profile)
			waiting += 1
			task.spawn(function()
				if not saveProfile(userId, profile, true) then
					warn(`[DeepDig] DATA LOSS: shutdown save failed for {userId}.`)
				end
				waiting -= 1
			end)
		end
		for player, profile in profiles do
			profiles[player] = nil
			flush(player.UserId, profile)
		end
		for userId, profile in pending do
			pending[userId] = nil
			flush(userId, profile)
		end
		local deadline = os.clock() + 25
		while waiting > 0 and os.clock() < deadline do
			task.wait(0.1)
		end
		if waiting > 0 then
			warn(`[DeepDig] Shutdown deadline reached with {waiting} saves still running.`)
		end
	end)
end

return PlayerData

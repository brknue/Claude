-- Deep Dig: every tuning number lives here.
local Config = {}

Config.BLOCK_SIZE = 4
Config.MINE_WIDTH = 16 -- blocks along X and Z
Config.MINE_DEPTH = 40 -- blocks down
Config.MINE_ORIGIN = Vector3.new(-32, 0, 24) -- min X, top Y, min Z corner
Config.SURFACE_POINT = Vector3.new(0, 5, -10)
Config.REFILL_SECONDS = 300
Config.DIG_COOLDOWN = 0.25
Config.REACH = 16
Config.SHOP_RANGE = 30

Config.ORES = {
	Coal = { value = 5, color = Color3.fromRGB(28, 28, 30), material = Enum.Material.Slate, rare = false },
	Copper = { value = 12, color = Color3.fromRGB(205, 115, 60), material = Enum.Material.Metal, rare = false },
	Iron = { value = 30, color = Color3.fromRGB(205, 195, 185), material = Enum.Material.Metal, rare = false },
	Silver = { value = 60, color = Color3.fromRGB(230, 235, 245), material = Enum.Material.Foil, rare = false },
	Gold = { value = 150, color = Color3.fromRGB(255, 200, 40), material = Enum.Material.Foil, rare = false },
	Ruby = { value = 400, color = Color3.fromRGB(235, 30, 65), material = Enum.Material.Neon, rare = true },
	Diamond = { value = 1200, color = Color3.fromRGB(90, 220, 255), material = Enum.Material.Neon, rare = true },
	["Void Crystal"] = { value = 10000, color = Color3.fromRGB(165, 60, 255), material = Enum.Material.Neon, rare = true },
	-- Only drops from meteorites during a meteor shower.
	["Star Shard"] = { value = 250, color = Color3.fromRGB(255, 235, 140), material = Enum.Material.Neon, rare = true },
}

-- Each layer covers 10 blocks of depth.
Config.LAYERS = {
	{ name = "Dirt", health = 3, color = Color3.fromRGB(122, 86, 56), material = Enum.Material.Ground,
		ores = { { name = "Coal", chance = 0.12 }, { name = "Copper", chance = 0.06 } } },
	{ name = "Stone", health = 8, color = Color3.fromRGB(125, 125, 130), material = Enum.Material.Slate,
		ores = { { name = "Iron", chance = 0.10 }, { name = "Silver", chance = 0.05 } } },
	{ name = "Deep Cave", health = 20, color = Color3.fromRGB(58, 64, 92), material = Enum.Material.Basalt,
		ores = { { name = "Gold", chance = 0.07 }, { name = "Ruby", chance = 0.03 } } },
	{ name = "Lava Rock", health = 50, color = Color3.fromRGB(78, 32, 26), material = Enum.Material.CrackedLava,
		ores = { { name = "Diamond", chance = 0.03 }, { name = "Void Crystal", chance = 0.004 } } },
}
Config.ORE_HEALTH_MULT = 1.5

Config.DRILLS = {
	{ name = "Rusty Drill", power = 1, price = 0 },
	{ name = "Iron Drill", power = 3, price = 150 },
	{ name = "Gold Drill", power = 8, price = 1500 },
	{ name = "Diamond Drill", power = 20, price = 12000 },
}

Config.BACKPACKS = {
	{ name = "Small Bag", size = 20, price = 0 },
	{ name = "Big Bag", size = 50, price = 400 },
	{ name = "Huge Bag", size = 150, price = 5000 },
}

-- Meteor shower: meteorites land on the surface around the hub and can be dug for Star Shards.
Config.METEOR = {
	interval = 600, -- seconds between showers
	warning = 10, -- seconds of warning before the first impact
	count = 10,
	lifetime = 90, -- seconds before unmined meteorites vanish
	health = 12,
	ore = "Star Shard",
	area = { minX = -70, maxX = 70, minZ = -60, maxZ = 14 },
}

-- How long another server's claim on a player's save is respected.
Config.SESSION_LOCK_SECONDS = 300

-- Onboarding funnel steps, in order.
Config.FUNNEL = { "Joined", "First block", "First ore", "First sale", "First upgrade" }

function Config.layerForDepth(gy: number)
	local index = math.clamp(math.ceil(gy / 10), 1, #Config.LAYERS)
	return Config.LAYERS[index]
end

return Config

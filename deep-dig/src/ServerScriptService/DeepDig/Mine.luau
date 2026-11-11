-- Owns the mine grid. Blocks are only created once a neighbour is dug (lazy reveal).
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("DeepDig"):WaitForChild("Config"))

local Mine = {}

local W, D, S = Config.MINE_WIDTH, Config.MINE_DEPTH, Config.BLOCK_SIZE
local origin = Config.MINE_ORIGIN
local blocksFolder = workspace:WaitForChild("DeepDig"):WaitForChild("Blocks")
local rng = Random.new()

-- grid[key]: nil = solid but not created yet, Part = visible block, false = dug out
local grid: { [number]: any } = {}
local info: { [Instance]: any } = {}
local locked = false

local function key(x: number, y: number, z: number): number
	return (y - 1) * W * W + (z - 1) * W + x
end

local function reveal(x: number, y: number, z: number)
	if x < 1 or x > W or z < 1 or z > W or y < 1 or y > D then
		return
	end
	local k = key(x, y, z)
	if grid[k] ~= nil then
		return
	end
	local layer = Config.layerForDepth(y)
	local oreName: string? = nil
	local roll, acc = rng:NextNumber(), 0
	for _, ore in layer.ores do
		acc += ore.chance
		if roll < acc then
			oreName = ore.name
			break
		end
	end

	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(S, S, S)
	part.Position = origin + Vector3.new((x - 0.5) * S, -(y - 0.5) * S, (z - 0.5) * S)
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	local health = layer.health
	if oreName then
		local ore = Config.ORES[oreName]
		part.Name = oreName
		part.Color = ore.color
		part.Material = ore.material
		health = math.ceil(health * Config.ORE_HEALTH_MULT)
		if ore.rare then
			local light = Instance.new("PointLight")
			light.Color = ore.color
			light.Range = 12
			light.Parent = part
		end
	else
		part.Name = layer.name
		part.Color = layer.color
		part.Material = layer.material
	end
	part.Parent = blocksFolder

	grid[k] = part
	info[part] = { x = x, y = y, z = z, health = health, maxHealth = health, ore = oreName, baseColor = part.Color }
end

function Mine.isLocked(): boolean
	return locked
end

-- Returns the block record for a part, or nil if it is not a live mine block.
function Mine.get(part: Instance)
	return info[part]
end

-- Applies damage. Returns true when the block broke.
function Mine.damage(part: Instance, amount: number): boolean
	local block = info[part]
	if not block or locked then
		return false
	end
	block.health -= amount
	if block.health > 0 then
		local worn = 1 - block.health / block.maxHealth
		local basePart = part :: BasePart
		basePart.Color = block.baseColor:Lerp(Color3.new(0, 0, 0), 0.55 * worn)
		return false
	end
	info[part] = nil
	grid[key(block.x, block.y, block.z)] = false
	part:Destroy()
	local x, y, z = block.x, block.y, block.z
	reveal(x + 1, y, z)
	reveal(x - 1, y, z)
	reveal(x, y, z + 1)
	reveal(x, y, z - 1)
	reveal(x, y + 1, z)
	reveal(x, y - 1, z)
	return true
end

-- Clears everything and rebuilds the top layer. Yields.
function Mine.generate()
	locked = true
	local n = 0
	for part in info do
		part:Destroy()
		n += 1
		if n % 400 == 0 then
			task.wait()
		end
	end
	table.clear(info)
	table.clear(grid)
	for x = 1, W do
		for z = 1, W do
			reveal(x, 1, z)
		end
	end
	locked = false
end

return Mine

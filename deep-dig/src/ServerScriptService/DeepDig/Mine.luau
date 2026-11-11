-- Owns the mine grid. Blocks are only created once a neighbour is dug (lazy reveal).
-- Also tracks "loose" diggable objects such as meteorites, which live outside the grid.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local shared = ReplicatedStorage:WaitForChild("DeepDig")
local Config = require(shared:WaitForChild("Config"))

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

-- Builder hook: a BasePart in ReplicatedStorage.DeepDig.BlockTemplates named after the block replaces the plain part.
function Mine.template(name: string): BasePart?
	local folder = shared:FindFirstChild("BlockTemplates")
	local template = folder and folder:FindFirstChild(name)
	if template and template:IsA("BasePart") then
		local clone = template:Clone()
		clone.Anchored = true
		return clone
	end
	return nil
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

	local name = oreName or layer.name
	local health = layer.health
	if oreName then
		health = math.ceil(health * Config.ORE_HEALTH_MULT)
	end
	local part = Mine.template(name)
	if not part then
		local plain = Instance.new("Part")
		plain.TopSurface = Enum.SurfaceType.Smooth
		plain.BottomSurface = Enum.SurfaceType.Smooth
		if oreName then
			local ore = Config.ORES[oreName]
			plain.Color = ore.color
			plain.Material = ore.material
			if ore.rare then
				local light = Instance.new("PointLight")
				light.Color = ore.color
				light.Range = 12
				light.Parent = plain
			end
		else
			plain.Color = layer.color
			plain.Material = layer.material
		end
		part = plain
	end
	local block = part :: BasePart
	block.Name = name
	block.Anchored = true
	block.Size = Vector3.new(S, S, S)
	block.Position = origin + Vector3.new((x - 0.5) * S, -(y - 0.5) * S, (z - 0.5) * S)
	block.Parent = blocksFolder

	grid[k] = block
	info[block] = { x = x, y = y, z = z, health = health, maxHealth = health, ore = oreName, baseColor = block.Color }
end

function Mine.isLocked(): boolean
	return locked
end

-- Returns the record for a diggable part, or nil if it is not one.
function Mine.get(part: Instance)
	return info[part]
end

-- Registers a diggable object that is not part of the grid (for example a meteorite).
function Mine.addLoose(part: BasePart, health: number, oreName: string?)
	info[part] = { loose = true, health = health, maxHealth = health, ore = oreName, baseColor = part.Color }
end

function Mine.removeLoose(part: Instance)
	local block = info[part]
	if block and block.loose then
		info[part] = nil
	end
end

-- Applies damage. Returns true when the block broke.
function Mine.damage(part: Instance, amount: number): boolean
	local block = info[part]
	if not block or (locked and not block.loose) then
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
	part:Destroy()
	if block.loose then
		return true
	end
	grid[key(block.x, block.y, block.z)] = false
	local x, y, z = block.x, block.y, block.z
	reveal(x + 1, y, z)
	reveal(x - 1, y, z)
	reveal(x, y, z + 1)
	reveal(x, y, z - 1)
	reveal(x, y + 1, z)
	reveal(x, y - 1, z)
	return true
end

-- Clears the grid and rebuilds the top layer. Loose objects are left alone. Yields.
function Mine.generate()
	locked = true
	-- Collect first: other code may register loose objects while this yields.
	local old = {}
	for part, block in info do
		if not block.loose then
			table.insert(old, part)
		end
	end
	for n, part in old do
		info[part] = nil
		part:Destroy()
		if n % 400 == 0 then
			task.wait()
		end
	end
	table.clear(grid)
	for x = 1, W do
		for z = 1, W do
			reveal(x, 1, z)
		end
	end
	locked = false
end

return Mine

import { TILES } from "../Constants";
import { Particles } from "../ui/Particles";
import Direction, { Directions } from "../util/Direction";
import Maths from "../util/Maths";
import Random from "../util/Random";
import { GameState, Stats } from "./Stats";
import Tile, { ITileContext, TileType } from "./Tile";

const BLANK_ROWS = TILES - 1;

export default class World {
	private first!: number;
	public readonly tiles: Tile[][] = [];
	private readonly mineshaft: (boolean | undefined)[] = [];
	public particles!: Particles;

	public constructor (public readonly stats: Stats) {
		this.generateNewWorld();
	}

	public setParticles (particles: Particles) {
		this.particles = particles;
	}

	public setTile (x: number, y: number, type: TileType) {
		this.invalidateAdjacentTiles(x, y);
		if (type === TileType.Mineshaft)
			this.mineshaft[y] = true;
		return this.tiles[y][x] = new Tile(type, this, x, y);
	}

	public removeTile (x: number, y: number, accessible: boolean) {
		this.invalidateAdjacentTiles(x, y);
		this.setTile(x, y, accessible ? TileType.Mineshaft : TileType.Cavern);
	}

	public getTile (x: number, y: number): Tile | undefined | null {
		if (!this.tiles[y])
			return null;

		if (x < 0 || x >= TILES)
			return null;

		return this.tiles[y]?.[x];
	}

	public getTileInDirection (direction: Direction, context: ITileContext): Tile | undefined | null;
	public getTileInDirection (direction: Direction, x: number, y: number): Tile | undefined | null;
	public getTileInDirection (direction: Direction, context: ITileContext | number, y?: number) {
		return this.getTile(...Directions.move(typeof context === "number" ? context : context.x, typeof context === "number" ? y! : context.y, direction));
	}

	public setHasMineable (y: number) {
		this.mineshaft[y] = true;
	}

	public hasMineshaft (y: number) {
		let mineshaft = this.mineshaft[y];
		if (mineshaft === undefined)
			mineshaft = this.mineshaft[y] = this.tiles[y]?.some(tile => tile.type === TileType.Mineshaft) ?? false;

		return mineshaft;
	}

	public generateFor (y: number) {
		while (this.tiles.length < y)
			this.generateRows();
	}

	public generateRow (tileType: TileType) {
		const y = this.tiles.length;
		const row: Tile[] = [];
		this.tiles.push(row);
		for (let x = 0; x < TILES; x++)
			this.setTile(x, y, tileType);
	}

	public generateRows (rows = Random.int(5, 20)) {
		for (let i = 0; i < rows; i++)
			this.generateRow(TileType.Rock);

		const below = this.tiles.length - rows;

		while (Random.chance(Maths.lerp(0.6, 0.7, this.stats.difficulty)))
			this.generateMetalRemains(below);

		while (Random.chance(Maths.lerp(0.6, 0.3, this.stats.difficulty)))
			this.generateCave(below);

		while (Random.chance(0.8)) {
			const size = Random.int(1, 4);
			let x = Random.int(0, TILES);
			let y = Random.int(this.tiles.length - rows, this.tiles.length);
			this.generateVeinAt(TileType.Gold, size, x, y, TileType.Rock);
		}

		// clean up old tiles
		// while (this.tiles.length - this.first > TILES * 2)
		// 	delete this.tiles[this.first++];

		// increment this.first
		while (this.tiles.length - this.first++ > TILES * 2);
	}

	public update () {
		if (this.stats.state === GameState.Surface && this.tiles.length > BLANK_ROWS + 4) {
			this.generateNewWorld();
			return;
		}

		let y = this.first;
		let row: (Tile | undefined)[];
		while (row = this.tiles[++y])
			for (const tile of row)
				tile?.update();
	}

	private invalidateAdjacentTiles (x: number, y: number) {
		for (const direction of Directions.CARDINALS)
			this.getTileInDirection(direction, x, y)?.invalidate();
	}

	private generateNewWorld () {
		this.first = -1;
		this.tiles.splice(0, Infinity);
		this.mineshaft.splice(0, Infinity);

		for (let i = 0; i < BLANK_ROWS; i++)
			this.generateRow(TileType.Mineshaft);

		this.generateRow(TileType.Grass);
		this.generateRow(TileType.Rock);
		this.generateRow(TileType.Rock);
	}

	private generateCave (below: number) {
		this.generateVeinBelow(TileType.Cavern, Random.int(10, 30), below, TileType.Rock);
	}

	private generateVeinBelow (type: TileType, size: number, below: number, replace?: TileType) {
		this.generateVeinAt(type,
			size,
			Random.int(TILES),
			Random.int(below, this.tiles.length),
			replace);
	}

	private generateVeinAt (type: TileType, size: number, x: number, y: number, replace?: TileType) {
		for (let i = 0; i < size; i++) {
			if (replace === undefined || this.getTile(x, y)?.type === replace)
				this.setTile(x, y, type);

			[x, y] = Directions.move(x, y, Random.choice(...Directions.CARDINALS));
		}
	}

	private generateMetalRemains (below: number) {
		this.generateStructure(below, {
			border: {
				type: TileType.Metal,
				decay: [{ type: TileType.Cavern, chance: Maths.lerp(0.7, 0.1, this.stats.difficulty) }],
			},
			inside: {
				type: TileType.Cavern,
				decay: [
					{ type: TileType.Metal, chance: 0.1 },
					{ type: TileType.Explosives, chance: 0.1 },
				],
			},
			width: Random.int(4, Maths.lerp(6, 12, this.stats.difficulty)),
			height: Random.int(4, 6),
		});
	}

	private generateStructure (below: number, options: IStructureGenerationOptions) {
		if (options.border === undefined && options.inside === undefined)
			return; // nothing to generate

		const maxY = this.tiles.length - options.height;
		if (maxY <= below)
			return;

		let x = Random.int(TILES);
		let y = Random.int(below, maxY);

		for (let yi = 0; yi < options.height; yi++) {
			for (let xi = 0; xi < options.width; xi++) {
				const isBorder = xi === 0 || yi === 0 || xi === options.width - 1 || yi === options.height - 1;
				const generationOptions = options[isBorder ? "border" : "inside"];
				if (generationOptions === undefined)
					continue;

				const generate = this.resolveGenerationOptions(generationOptions);
				this.setTile(x + xi, y + yi, generate);
			}
		}
	}

	private resolveGenerationOptions (options: TileGenerationOptions): TileType {
		if (typeof options === "number")
			return options;

		for (const decay of options.decay ?? [])
			if (Random.chance(decay?.chance ?? 0))
				return this.resolveGenerationOptions(decay!);

		return options.type;
	}
}

interface IStructureGenerationOptions {
	border?: TileGenerationOptions;
	inside?: TileGenerationOptions;
	width: number;
	height: number;
}

type TileGenerationOptions = TileType | ITileGenerationOptions;

interface ITileGenerationOptions {
	type: TileType;
	decay?: ITileDecayOptions[];
}

interface ITileDecayOptions extends ITileGenerationOptions {
	chance: number;
}
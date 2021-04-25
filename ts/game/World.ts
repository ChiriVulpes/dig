import { TILES } from "../Constants";
import Direction, { Directions } from "../util/Direction";
import Random from "../util/Random";
import { Stats } from "./Stats";
import Tile, { ITileContext, TileType } from "./Tile";

const BLANK_ROWS = TILES - 1;

export default class World {
	private first = -1;
	public readonly tiles: Tile[][] = [];

	public constructor (public readonly stats: Stats) {
		for (let i = 0; i < BLANK_ROWS; i++)
			this.generateRow(TileType.Mineshaft);

		this.generateRow(TileType.Grass);
		this.generateRow(TileType.Rock);
		this.generateRow(TileType.Rock);
	}

	public setTile (x: number, y: number, type: TileType) {
		this.invalidateAdjacentTiles(x, y);
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

		while (Random.chance(0.4))
			this.generateMetalRemains(below);

		while (Random.chance(0.5))
			this.generateCave(below);

		while (Random.chance(0.6)) {
			const size = Random.int(1, 4);
			let x = Random.int(0, TILES);
			let y = Random.int(this.tiles.length - rows, this.tiles.length);
			this.generateVeinAt(TileType.Emerald, size, x, y, TileType.Rock);
		}

		while (this.tiles.length - this.first > TILES * 2)
			delete this.tiles[this.first++];
	}

	public update () {
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
				decay: { type: TileType.Cavern, chance: Random.float(0.1) },
			},
			inside: {
				type: TileType.Cavern,
				decay: { type: TileType.Metal, chance: Random.float(0.1) },
			},
			width: Random.int(4, 10),
			height: Random.int(3, 5),
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
				const isBorder = xi === 0 || yi === 0 || xi === options.height - 1 || yi === options.height - 1;
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

		if (Random.chance(options.decay?.chance ?? 0))
			return this.resolveGenerationOptions(options.decay!);

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
	decay?: ITileDecayOptions;
}

interface ITileDecayOptions extends ITileGenerationOptions {
	chance: number;
}
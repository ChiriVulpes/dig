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

	public generateRows (rows = Random.int(1, 5)) {
		for (let i = 0; i < rows; i++)
			this.generateRow(TileType.Rock);

		if (rows >= 3 && Random.chance(0.5)) {
			const width = Random.int(4, 10);
			const startX = Random.int(1 - width, TILES);
			const structureType = Random.chance(0.3) ? TileType.Cavern : TileType.Metal;
			for (let y = this.tiles.length - rows; y < this.tiles.length; y++)
				for (let x = Math.max(0, startX); x < Math.min(startX + width, TILES); x++)
					this.setTile(x, y, structureType);
		}

		while (Random.chance(0.1)) {
			const size = Random.int(1, 4);
			let x = Random.int(0, TILES);
			let y = Random.int(this.tiles.length - rows, this.tiles.length);
			const oreType = TileType.Emerald;
			for (let i = 0; i < size; i++) {
				if (this.getTile(x, y)?.type === TileType.Rock)
					this.setTile(x, y, oreType);

				[x, y] = Directions.move(x, y, Random.choice(...Directions.CARDINALS));
			}
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
}
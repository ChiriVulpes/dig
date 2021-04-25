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
			this.generateRow();

		this.generateRow(TileType.Grass);
		this.generateFor(TILES + 1);
	}

	public setTile (x: number, y: number, type: TileType) {
		this.invalidateAdjacentTiles(x, y);
		return this.tiles[y][x] = new Tile(type)
			.setContext(this, x, y);
	}

	public removeTile (x: number, y: number) {
		this.invalidateAdjacentTiles(x, y);
		delete this.tiles[y]?.[x];
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

	public generateRow (tileType?: TileType) {
		const y = this.tiles.length;
		const row: Tile[] = [];
		this.tiles.push(row);
		if (tileType !== undefined)
			for (let x = 0; x < TILES; x++)
				this.setTile(x, y, tileType);
	}

	public generateRows (rows = Random.int(1, 5)) {
		for (let i = 0; i < rows; i++)
			this.generateRow(TileType.Rock);

		if (rows >= 3) {
			const width = Random.int(4, 10);
			const startX = Random.int(1 - width, TILES);
			for (let y = this.tiles.length - rows; y < this.tiles.length; y++)
				for (let x = Math.max(0, startX); x < Math.min(startX + width, TILES); x++)
					this.setTile(x, y, TileType.Metal);
		}

		while (this.tiles.length - this.first > TILES * 2)
			delete this.tiles[this.first++];
	}

	private invalidateAdjacentTiles (x: number, y: number) {
		for (const direction of Directions.CARDINALS)
			this.getTileInDirection(direction, x, y)?.invalidate(this.stats.tick);
	}
}
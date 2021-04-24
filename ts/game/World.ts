import { TILES } from "../Constants";
import Direction, { Directions } from "../util/Direction";
import Enums from "../util/Enums";
import Random from "../util/Random";
import { Stats } from "./Stats";
import Tile, { TileType } from "./Tile";

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
		this.invalidateAdjacentTileMasks(x, y);
		return this.tiles[y][x] = new Tile(type)
			.setContext(this, x, y);
	}

	public removeTile (x: number, y: number) {
		this.invalidateAdjacentTileMasks(x, y);
		delete this.tiles[y]?.[x];
	}

	public getTile (x: number, y: number): Tile | undefined {
		return this.tiles[y]?.[x];
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

	private invalidateAdjacentTileMasks (x: number, y: number) {
		for (const direction of Enums.values(Direction))
			this.getTile(...Directions.move(x, y, direction))?.invalidateMask();
	}
}
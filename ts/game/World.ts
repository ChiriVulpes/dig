import { TILES } from "../Constants";
import Random from "../util/Random";
import Tile, { TileType } from "./Tile";

export default class World {
	private first = -1;
	public readonly tiles: Tile[][] = [];

	public get width () {
		return TILES;
	}

	public setTile (x: number, y: number, type: TileType) {
		return this.tiles[y][x] = new Tile(type)
			.setContext(this, x, y);
	}

	public removeTile (x: number, y: number) {
		delete this.tiles[y]?.[x];
	}

	public getTile (x: number, y: number) {
		return this.tiles[y]?.[x];
	}

	public generateFor (y: number) {
		while (this.tiles.length < y)
			this.generateRows();
	}

	public generateRows (rows = Random.int(1, 5)) {
		for (let i = 0; i < rows; i++) {
			const y = this.tiles.length;
			const row: Tile[] = [];
			this.tiles.push(row);
			for (let x = 0; x < TILES; x++)
				this.setTile(x, y, TileType.Rock);
		}

		while (this.tiles.length - this.first > TILES * 2)
			delete this.tiles[this.first++];
	}
}
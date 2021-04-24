import { TILES } from "../Constants";
import Tile, { TileType } from "./Tile";

const TILES_VERTICAL = TILES * 2;

export default class World {
	public readonly tiles: Tile[][] = new Array(TILES_VERTICAL).fill(undefined)
		.map(() => new Array(TILES));

	public get width () {
		return TILES;
	}

	public get height () {
		return TILES_VERTICAL;
	}

	public setTile (x: number, y: number, type: TileType) {
		return this.tiles[y][x] = new Tile(type);
	}

	public getTile (x: number, y: number) {
		return this.tiles[y][x];
	}
}
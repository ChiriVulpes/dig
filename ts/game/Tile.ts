import { TILE } from "../Constants";
import Canvas from "../ui/Canvas";
import Sprite from "../ui/Sprite";

export enum TileType {
	Rock,
}

export default class Tile {
	public constructor (public readonly type: TileType) {

	}

	public getSprite () {
		return Sprite.get(`tile/${TileType[this.type].toLowerCase()}`);
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.getSprite().render(canvas, x * TILE, y * TILE);
	}
}

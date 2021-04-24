import { TILE, TILES } from "../Constants";
import World from "../game/World";
import Canvas from "./Canvas";

export class View {
	public y = 0;

	public getTopVisibleRowY () {
		return Math.ceil(this.y / TILE);
	}

	public getBottomVisibleRowY () {
		return Math.floor(this.y + TILES * TILE / TILE);
	}

	public render (world: World, canvas: Canvas) {
		const topY = this.getTopVisibleRowY();
		const bottomY = this.getBottomVisibleRowY();
		for (let y = topY; y <= bottomY; y++) {
			for (let x = 0; x < TILES; x++) {
				const tile = world.getTile(x, y);
				tile?.render(canvas, x, y - this.y);
			}
		}
	}
}
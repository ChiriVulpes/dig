import { TILE, TILES } from "../Constants";
import World from "../game/World";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";

export class View {
	public y = 0;

	public getTopVisibleRowY () {
		return Math.floor(this.y / TILE);
	}

	public getBottomVisibleRowY () {
		return Math.ceil((this.y + TILES * TILE) / TILE);
	}

	private step = 0;
	public update (world: World, mouse: Mouse) {
		this.step++;

		if (this.step <= 0) {
			this.y++;
			mouse.update();
			world.generateFor(this.getBottomVisibleRowY());
		}

		if (this.step > 0)
			this.step = -16;
	}

	public render (world: World, canvas: Canvas) {
		const topY = this.getTopVisibleRowY();
		const bottomY = this.getBottomVisibleRowY();

		for (let y = topY; y <= bottomY; y++) {
			for (let x = 0; x < TILES; x++) {
				const tile = world.getTile(x, y);
				tile?.render(canvas, x * TILE, y * TILE - this.y);
			}
		}
	}
}
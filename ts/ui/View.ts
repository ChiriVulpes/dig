import { TILE, TILES } from "../Constants";
import { Stats } from "../game/Stats";
import World from "../game/World";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";
import Sprite from "./Sprite";

// const SURFACE_TILES = 20;

export class View {
	public y = 0;

	public constructor () {
	}

	public getTopVisibleRowY () {
		return Math.floor(this.y / TILE);
	}

	public getBottomVisibleRowY () {
		return Math.ceil((this.y + TILES * TILE) / TILE);
	}

	private step = 0;
	public update (world: World, stats: Stats, mouse: Mouse) {
		this.step++;

		if (this.step <= 0 && this.step % 2) {
			this.y++;
			mouse.updatePosition();
			world.generateFor(this.getBottomVisibleRowY() + 1);
		}

		if (this.y % 16)
			stats.turn++;

		if (this.step && stats.dug > this.y / TILE)
			this.step = -32;
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

		canvas.context.globalCompositeOperation = "destination-over";
		Sprite.get("background/surface").render(canvas, 0, -this.y);
		canvas.context.globalCompositeOperation = "source-over";
	}
}
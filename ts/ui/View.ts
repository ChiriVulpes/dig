import { TILE, TILES } from "../Constants";
import { Stats } from "../game/Stats";
import World from "../game/World";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";
import Sprite from "./Sprite";

const SURFACE_TILES = 20;

export class View {
	public y = 0;

	private canvas?: Canvas;

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

		if (this.step <= 0) {
			this.y++;
			mouse.update();
			world.generateFor(this.getBottomVisibleRowY() + 1);
		}

		if (this.step > 100 && stats.dug > this.y / TILE)
			this.step = -16;
	}

	public render (world: World, canvas: Canvas) {
		Sprite.get("background/surface").render(canvas, 0, -this.y);
		Sprite.get("background/rock").renderTiled(canvas, 0, -this.y + SURFACE_TILES * TILE);

		if (!this.canvas)
			this.canvas = new Canvas().setSize(TILE * TILES, TILE * TILES);

		this.canvas.clear();
		const topY = this.getTopVisibleRowY();
		const bottomY = this.getBottomVisibleRowY();

		for (let y = topY; y <= bottomY; y++) {
			for (let x = 0; x < TILES; x++) {
				const tile = world.getTile(x, y);
				tile?.render(this.canvas, x * TILE, y * TILE - this.y);
			}
		}

		this.canvas.render(canvas);
	}
}
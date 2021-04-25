import { TILE, TILES } from "../Constants";
import { GameState, Stats } from "../game/Stats";
import World from "../game/World";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";
import Sprite from "./Sprite";

const VIEW_PADDING_TILES = 4;

export class View {
	public y = 0;

	public constructor () {
	}

	public getTopVisibleRowY () {
		return Math.floor(this.y / TILE);
	}

	public getTopAccessibleRowY () {
		return Math.ceil(this.y / TILE);
	}

	public getBottomVisibleRowY () {
		return Math.ceil((this.y + TILES * TILE) / TILE);
	}

	private step = 0;
	public update (world: World, stats: Stats, mouse: Mouse) {
		this.step++;

		if (stats.state === GameState.FellBehind) {
			if (this.step < -300 + 32 && this.step % 2)
				this.y++;

			if (this.step > 0 && this.step % 2 && this.y > 0)
				this.y--;

			return;
		}

		if (stats.state === GameState.Surface) {
			this.y = 0;
			return;
		}

		const bottomRow = this.getBottomVisibleRowY();
		if (this.step > 0 && (stats.dug > this.y / TILE || world.hasMineshaft(bottomRow - VIEW_PADDING_TILES)))
			this.step = -32;

		if (this.step <= 0 && this.step % 2) {
			this.y++;
			mouse.updatePosition();
			world.generateFor(bottomRow + 1);

			if (this.y % 16 === 0) {
				stats.passTurn();
				stats.score += 10;
			}
		}

		let hasMineshaft = false;
		for (let y = this.getTopAccessibleRowY(); y < bottomRow; y++)
			if (world.hasMineshaft(y)) {
				hasMineshaft = true;
				break;
			}

		if (!hasMineshaft && stats.state === GameState.Mining) {
			stats.endGame();
			this.step = -300;
		}
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
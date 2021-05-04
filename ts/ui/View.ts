import { IEventApi } from "@@wayward/excevent/IExcevent";
import Events, { EventBus } from "Events";
import Tile from "game/Tile";
import { GameState, TILE, TILES } from "../Constants";
import { Stats } from "../game/Stats";
import World from "../game/World";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";
import Sprite from "./Sprite";

const VIEW_PADDING_TILES = 6;

@Events.Subscribe
@Events.Bus(EventBus.View)
export class View {
	public y = 0;

	public constructor (public readonly world: World, public readonly mouse: Mouse) {
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
	public update (stats: Stats) {
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
		if (this.step > 0 && (stats.dug > this.y / TILE || this.world.hasMineshaft(bottomRow - VIEW_PADDING_TILES)))
			this.step = -32;

		if (this.step < 0 && this.step % 2 === 0) {
			if (this.y % 16 === 0) {
				stats.passTurn();
				stats.score += 10;
			}

			this.y++;
			this.mouse.updateTarget();
			this.world.generateFor(bottomRow + 1);
		}

		let hasMineshaft = false;
		let hasMineable = false;
		for (let y = this.getTopAccessibleRowY(); y < bottomRow + 2; y++) {
			if (this.world.hasMineshaft(y))
				hasMineshaft = true;

			if (this.world.hasMineable(y))
				hasMineable = true;

			if (hasMineshaft && hasMineable)
				break;
		}

		if ((!hasMineshaft || !hasMineable) && stats.state === GameState.Mining) {
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

	@Events.Handler(EventBus.Mouse, "getTarget")
	protected getTarget (api: IEventApi<Mouse>) {
		let [x, y] = api.host.point;
		y += this.y;

		x = Math.floor(x / TILE);
		y = Math.floor(y / TILE);

		return this.world.getTile(x, y) ?? undefined;
	}

	@Events.Handler(EventBus.World, "change")
	protected onTileChange (api: IEventApi<World>, x: number, y: number, tile?: Tile, oldTile?: Tile) {
		if (oldTile === this.mouse.target)
			this.mouse.updateTarget();
	}
}
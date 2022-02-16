import { EventHost } from "@@wayward/excevent/Emitter";
import { IEventApi } from "@@wayward/excevent/IExcevent";
import Events, { EventBus } from "Events";
import Tile from "game/Tile";
import HashSet from "util/collection/HashSet";
import Bound from "util/decorator/Bound";
import { Point } from "util/Geometry";
import { CANVAS, GameState, TILE, TILES } from "../Constants";
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

	private readonly canvasTiles = new ViewCanvas()
		.event.subscribe("render", this.renderTiles);
	// private readonly canvasLight = new Canvas();

	public constructor (public readonly world: World, public readonly mouse: Mouse) {
	}

	public getTopVisibleRowY () {
		return Math.floor(this.y / TILE);
	}

	public getTopAccessibleRowY () {
		return Math.ceil(this.y / TILE);
	}

	public getBottomVisibleRowY () {
		return Math.ceil((this.y + CANVAS) / TILE);
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
			this.world.generateFor(bottomRow + 10);
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

	private readonly tilesToRerender = new HashSet(Point.serialize);

	public render (canvas: Canvas) {
		for (const [x, y] of this.tilesToRerender.values()) {
			const canvas = this.canvasTiles.getCanvas(y * TILE);
			if (canvas)
				this.renderTile(canvas.canvas, x, y % TILES, canvas.y);
		}

		this.canvasTiles.render(canvas, this.y);

		// const topY = this.getTopVisibleRowY();
		// const bottomY = this.getBottomVisibleRowY();

		canvas.context.globalCompositeOperation = "destination-over";
		Sprite.get("background/surface").render(canvas, 0, -this.y);
		canvas.context.globalCompositeOperation = "source-over";
	}

	@Events.Handler(EventBus.Mouse, "getTarget")
	protected getTarget (api: IEventApi<Mouse>) {
		if (this.world.stats.state === GameState.FellBehind)
			return undefined;

		let [x, y] = api.host.point;
		y += this.y;

		x = Math.floor(x / TILE);
		y = Math.floor(y / TILE);

		return this.world.getTile(x, y) ?? undefined;
	}

	@Events.Handler(EventBus.World, "change")
	@Events.Handler(EventBus.World, "rerender")
	protected onTileChange (api: IEventApi<World>, x: number, y: number, tile?: Tile, oldTile?: Tile) {
		if (oldTile === this.mouse.target)
			this.mouse.updateTarget();

		this.tilesToRerender.add(x, y);
	}

	@Bound private renderTiles (api: any, canvas: Canvas, y: number) {
		const canvasTileY = y / TILE;

		for (let y = 0; y < TILES; y++) {
			for (let x = 0; x < TILES; x++) {
				this.renderTile(canvas, x, y, canvasTileY);
			}
		}
	}

	private renderTile (canvas: Canvas, x: number, y: number, canvasOffset: number) {
		const tile = this.world.getTile(x, canvasOffset + y);
		tile?.render(canvas, x * TILE, y * TILE);
	}
}

interface IViewCanvasEvents {
	render (canvas: Canvas, y: number): any;
}

interface IPositionedCanvas {
	y: number;
	canvas: Canvas;
}

class ViewCanvas extends EventHost(Events)<IViewCanvasEvents> {

	private readonly canvases: IPositionedCanvas[] = [];

	public constructor () {
		super();

		for (let i = 0; i < 3; i++)
			this.canvases.push({ y: i * CANVAS, canvas: new Canvas().setSize(CANVAS) });
	}

	public getCanvas (y: number) {
		let lastCanvas: IPositionedCanvas | undefined;
		for (const canvas of this.canvases)
			if (canvas.y > y)
				break;
			else
				lastCanvas = canvas;

		return lastCanvas;
	}

	public render (canvas: Canvas, y: number) {
		for (const prerenderedCanvas of this.canvases)
			if (prerenderedCanvas.y + CANVAS < y || prerenderedCanvas.y > y + CANVAS)
				continue;
			else
				prerenderedCanvas.canvas.render(canvas, 0, prerenderedCanvas.y - y);

		////////////////////////////////////
		// Re-rendering
		//

		const firstCanvas = this.canvases[0];
		const lastCanvas = this.canvases[this.canvases.length - 1];

		if (y > lastCanvas.y - CANVAS / 2)
			this.rerender(this.moveFirstToLast(), lastCanvas.y + CANVAS);

		else if (y < firstCanvas.y + CANVAS / 2)
			this.rerender(this.moveLastToFirst(), firstCanvas.y - CANVAS);
	}

	private moveFirstToLast () {
		const canvas = this.canvases.shift()!;
		this.canvases.push(canvas);
		return canvas;
	}

	private moveLastToFirst () {
		const canvas = this.canvases.pop()!;
		this.canvases.unshift(canvas);
		return canvas;
	}

	private rerender (canvas: IPositionedCanvas, y: number) {
		canvas.canvas.clear();
		canvas.y = y;
		this.event.emit("render", canvas.canvas, canvas.y);
	}
}

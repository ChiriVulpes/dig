import { TILE, TILES } from "../Constants";
import Tile from "../game/Tile";
import World from "../game/World";
import Canvas from "./Canvas";
import { View } from "./View";

type CursorEvent = Partial<MouseEvent> & Partial<TouchEvent>;

export interface IHasMouseEventHandlers {
	onMouseEnter (): any;
	onMouseLeave (): any;
	onMouseDown (): any;
	onMouseUp (): any;
	onMouseClick (): any;
}

export class Mouse {

	public tile?: Tile;

	private x = 0;
	private y = 0;

	private canvas?: Canvas;
	private world?: World;
	private view?: View;

	public constructor () {
		window.addEventListener("mousemove", event => this.onMove(event));
		window.addEventListener("click", event => this.onClick(event));
		window.addEventListener("mousedown", event => this.onDown(event));
		window.addEventListener("mouseup", event => this.onUp(event));
	}

	public setCanvas (canvas: Canvas) {
		this.canvas = canvas;
		return this;
	}

	public setWorld (world: World) {
		this.world = world;
		return this;
	}

	public setView (view: View) {
		this.view = view;
		return this;
	}

	public update (event?: CursorEvent) {
		const x = this.x = event?.clientX ?? event?.touches?.[0].clientX ?? this.x;
		const y = this.y = event?.clientY ?? event?.touches?.[0].clientY ?? this.y;

		const newTile = this.calculateTarget(x, y);
		if (this.tile === newTile)
			return;

		this.tile?.onMouseLeave();
		this.tile = newTile;
		newTile?.onMouseEnter();
	}

	private calculateTarget (x: number, y: number) {
		if (!this.canvas || !this.world || !this.view)
			return undefined;

		const canvasOffset = this.canvas.getOffset();
		x -= canvasOffset.x;
		y -= canvasOffset.y;

		const canvasSize = this.canvas.getDisplaySize()!;
		if (x < 0 || x > canvasSize.x || y < 0 || y > canvasSize.y)
			return undefined;

		const size = TILES * TILE;
		x *= size / canvasSize.x;
		y *= size / canvasSize.y;

		y += this.view.y;

		x = Math.floor(x / TILE);
		y = Math.floor(y / TILE);

		return this.world.getTile(x, y);
	}

	private onMove (event: CursorEvent) {
		this.update(event);
	}

	private onClick (event: CursorEvent) {
		this.update(event);
		this.tile?.onMouseClick();
	}

	private onDown (event: CursorEvent) {
		this.update(event);
		this.tile?.onMouseDown();
	}

	private onUp (event: CursorEvent) {
		this.update(event);
		this.tile?.onMouseUp();
	}
}

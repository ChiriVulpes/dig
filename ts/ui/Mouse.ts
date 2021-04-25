import { TILE, TILES } from "../Constants";
import { GameState } from "../game/Stats";
import Tile from "../game/Tile";
import World from "../game/World";
import Canvas from "./Canvas";
import { Ui } from "./Ui";
import { View } from "./View";

type CursorEvent = Partial<MouseEvent> & Partial<TouchEvent>;

export interface IMouseEventHandler {
	onMouseEnter?(): any;
	onMouseLeave?(): any;
	onMouseMove?(x: number, y: number): any;
	onMouseDown?(x: number, y: number): any;
	onMouseUp?(x: number, y: number): any;
	onMouseClick?(x: number, y: number): any;
	onMouseRightClick?(x: number, y: number): any;
	onMouseHold?(x: number, y: number): any;
}

export class Mouse {

	public tile?: Tile;
	private held = false;

	private x = 0;
	private y = 0;

	private canvas?: Canvas;
	private world?: World;
	private view?: View;
	private ui?: Ui;

	public constructor () {
		window.addEventListener("mousemove", event => this.onMove(event));
		window.addEventListener("click", event => this.onClick(event));
		window.addEventListener("mousedown", event => this.onDown(event));
		window.addEventListener("mouseup", event => this.onUp(event));
		window.addEventListener("contextmenu", event => this.onRightClick(event));
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

	public setUi (ui: Ui) {
		this.ui = ui;
		return this;
	}

	public update () {
		if (this.held)
			this.tile?.onMouseHold(this.x, this.y);
	}

	public updatePosition (event?: CursorEvent) {
		const oldX = this.x;
		const oldY = this.y;
		const x = this.x = event?.clientX ?? event?.touches?.[0].clientX ?? this.x;
		const y = this.y = event?.clientY ?? event?.touches?.[0].clientY ?? this.y;

		if (x !== oldX || y !== oldY)
			this.emitMouseEvent("onMouseMove", this.ui);

		const newTile = this.calculateTarget(x, y);
		if (this.tile === newTile)
			return;

		this.tile?.onMouseLeave();
		this.tile = newTile ?? undefined;
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

		if (this.world.stats.state === GameState.FellBehind)
			return undefined;

		return this.calculateTileTarget(x, y);
	}

	private calculateTileTarget (x: number, y: number) {
		y += this.view!.y;

		x = Math.floor(x / TILE);
		y = Math.floor(y / TILE);

		return this.world!.getTile(x, y);
	}

	private onMove (event: CursorEvent) {
		this.updatePosition(event);
	}

	private onClick (event: CursorEvent) {
		this.updatePosition(event);
		this.emitMouseEvent("onMouseClick", this.tile, this.ui);
	}

	private onRightClick (event: CursorEvent) {
		if ((event.target as Partial<HTMLElement>).tagName === "CANVAS")
			event.preventDefault?.();

		this.updatePosition(event);
		this.emitMouseEvent("onMouseRightClick", this.tile, this.ui);
	}

	private onDown (event: CursorEvent) {
		if (event.button === 2)
			return;

		this.updatePosition(event);
		this.held = true;
		this.emitMouseEvent("onMouseDown", this.tile, this.ui);
		this.emitMouseEvent("onMouseHold", this.tile, this.ui);
	}

	private onUp (event: CursorEvent) {
		this.updatePosition(event);
		this.emitMouseEvent("onMouseUp", this.tile, this.ui);
		this.held = false;
	}

	private emitMouseEvent (event: keyof IMouseEventHandler, ...handlers: (IMouseEventHandler | undefined)[]) {
		for (const handler of handlers)
			handler?.[event]?.(this.x, this.y);
	}
}

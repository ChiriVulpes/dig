import Events, { EventBus, EventEmitter, EventHost } from "Events";
import Bound from "util/decorator/Bound";
import { Point, Rectangle } from "util/Geometry";
import Canvas from "./Canvas";

type CursorEvent = Partial<MouseEvent> & Partial<TouchEvent>;

export interface IMouseEvents {
	enter (target: ITarget): any;
	leave (oldTarget: ITarget): any;
	move (x: number, y: number): any;
	down (x: number, y: number): any;
	up (x: number, y: number): any;
	click (x: number, y: number): any;
	rightClick (x: number, y: number): any;
	hold (x: number, y: number): any;
	getTarget (): ITarget | undefined;
}

interface IMouseTargetEvents {
	mouseEnter (mouse: Mouse): any;
	mouseLeave (mouse: Mouse): any;
	mouseMove (mouse: Mouse): any;
	mouseDown (mouse: Mouse): any;
	mouseUp (mouse: Mouse): any;
	mouseClick (mouse: Mouse): any;
	mouseRightClick (mouse: Mouse): any;
	mouseHold (mouse: Mouse): any;
}

export interface ITarget {
	surface?: Rectangle;
	event: EventEmitter<ITarget, IMouseTargetEvents>;
}

@Events.Bus(EventBus.Mouse)
export class Mouse extends EventHost(Events)<IMouseEvents> {

	public target?: ITarget;
	private held = false;

	public point: Point = [NaN, NaN];

	public get isValid () {
		return !isNaN(this.point[0]) && !isNaN(this.point[1]);
	}

	public constructor (private readonly surface: Canvas) {
		super();

		window.addEventListener("mousemove", event => this.onMove(event));
		window.addEventListener("click", event => this.onClick(event));
		window.addEventListener("mousedown", event => this.onDown(event));
		window.addEventListener("mouseup", event => this.onUp(event));
		window.addEventListener("contextmenu", event => this.onRightClick(event));
	}

	public update () {
		if (this.held) {
			this.event.emit("hold", ...this.point);
			this.target?.event.emit("mouseHold", this);
		}
	}

	public updateTarget () {
		const oldTarget = this.target;
		const target = !this.isValid ? undefined
			: this.event.query("getTarget")
				.get(this.isTargeting);

		if (oldTarget !== target) {
			if (oldTarget) {
				this.event.emit("leave", oldTarget);
				oldTarget.event.emit("mouseLeave", this);
			}

			if (target) {
				this.event.emit("enter", target);
				target.event.emit("mouseEnter", this);
			}

			this.target = target;
		}
	}

	private updatePosition (event?: CursorEvent) {
		const [oldX, oldY] = this.point;
		const [x, y] = this.getPoint(event);

		if (oldX === x && oldY === y)
			return;

		this.point = [x, y];

		this.updateTarget();

		this.event.emit("move", x, y);
		this.target?.event.emit("mouseMove", this);
	}

	@Bound private isTargeting (target: ITarget) {
		return target.surface === undefined || Rectangle.intersects(...target.surface, ...this.point);
	}

	private getPoint (event?: CursorEvent): Point {
		let x = event?.clientX ?? event?.touches?.[0].clientX ?? NaN;
		let y = event?.clientY ?? event?.touches?.[0].clientY ?? NaN;

		if (this.surface && !isNaN(x) && !isNaN(y)) {
			const canvasOffset = this.surface.getOffset();
			x -= canvasOffset.x;
			y -= canvasOffset.y;

			const canvasSize = this.surface.getDisplaySize()!;
			if (x >= 0 || x < canvasSize.x || y >= 0 || y < canvasSize.y) {
				x *= this.surface.width / canvasSize.x;
				y *= this.surface.height / canvasSize.y;
			} else {
				x = NaN;
				y = NaN;
			}
		} else {
			x = NaN;
			y = NaN;
		}

		return [x, y];
	}

	private onMove (event: CursorEvent) {
		this.updatePosition(event);
	}

	private onClick (event: CursorEvent) {
		this.updatePosition(event);
		this.event.emit("click", ...this.point);
		this.target?.event.emit("mouseClick", this);
	}

	private onRightClick (event: CursorEvent) {
		if ((event.target as Partial<HTMLElement>).tagName === "CANVAS")
			event.preventDefault?.();

		this.updatePosition(event);
		this.event.emit("rightClick", ...this.point);
		this.target?.event.emit("mouseRightClick", this);
	}

	private onDown (event: CursorEvent) {
		if (event.button === 2)
			return;

		this.updatePosition(event);
		this.held = true;
		this.event.emit("down", ...this.point);
		this.target?.event.emit("mouseDown", this);
		this.event.emit("hold", ...this.point);
		this.target?.event.emit("mouseHold", this);
	}

	private onUp (event: CursorEvent) {
		this.updatePosition(event);
		this.event.emit("up", ...this.point);
		this.target?.event.emit("mouseUp", this);
		this.held = false;
	}
}

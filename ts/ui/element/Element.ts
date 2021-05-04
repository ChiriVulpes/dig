import { EventHost } from "@@wayward/excevent/Emitter";
import Events from "Events";
import Canvas from "ui/Canvas";

export interface IElementEvents {
	refresh (): any;
	needsRefresh (): any;
	reflow (): any;
	needsReflow (): any;
	render (): any;
	needsRender (): any;
}

export interface IElementInfo {
	width: number;
	height: number;
}

export default abstract class Element<INFO extends IElementInfo = IElementInfo> extends EventHost(Events)<IElementEvents> {

	private _info?: INFO;
	private pendingInfo?: INFO;
	protected shouldReflow = false;
	public get info () {
		if (this._info === undefined || this.shouldReflow)
			this.forceReflow();

		return this._info ?? this.pendingInfo;
	}

	public constructor () {
		super();
	}

	protected shouldRefresh = false;
	public markNeedsRefresh () {
		if (!this.shouldRefresh) {
			this.shouldRefresh = true;
			this.event.emit("needsRefresh");
		}
		return this;
	}

	protected abstract refresh (): void;

	protected abstract reflow (): INFO;

	public markNeedsReflow () {
		if (!this.shouldReflow) {
			this.shouldReflow = true;
			this.event.emit("needsReflow");
		}
		return this;
	}

	private image?: Canvas;
	private generating = false;

	public draw (canvas: Canvas, x: number, y: number) {
		this.getImage()?.render(canvas, x, y);
	}

	private shouldRerender = false;
	public markNeedsRerender () {
		if (!this.shouldRerender) {
			this.shouldRerender = true;
			this.event.emit("needsRender");
		}
		return this;
	}

	private rendered?: Promise<void>;
	public getImage () {
		if (this.shouldRefresh)
			this.forceRefresh();

		if (this.shouldReflow)
			this.forceReflow();

		if ((!this.image || this.shouldRerender) && !this.generating)
			this.rendered = this.generateImage();

		return this.image;
	}

	public forceRefresh () {
		this.refresh();
		this.shouldRefresh = false;
		this.event.emit("refresh");
	}

	public forceReflow () {
		this.pendingInfo = this.reflow();
		this.shouldReflow = false;
		this.event.emit("reflow");
		this.markNeedsRerender();
	}

	public waitForRendered () {
		this.getImage();
		return this.rendered!;
	}

	private async generateImage () {
		this.generating = true;
		const result = new Canvas();
		const info = this.pendingInfo!;
		const { width, height } = info;
		if (width !== 0 && height !== 0) {
			result.setSize(width, height);

			await this.render(result, info);

			this.image = result;
			this._info = this.pendingInfo;
			this.shouldRerender = false;
			this.event.emit("render");
		}

		this.generating = false;
	}

	protected abstract render (canvas: Canvas, info: INFO): Promise<void>;

	protected abstract equals (element: this): boolean;

	public static equals (elementA: unknown, elementB: unknown) {
		if (elementA instanceof Element && elementB instanceof Element)
			return elementA.equals(elementB);
		return elementA === elementB;
	}
}

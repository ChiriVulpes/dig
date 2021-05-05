import { EventHost } from "@@wayward/excevent/Emitter";
import { Class, EventBusOrHost, IEventApi } from "@@wayward/excevent/IExcevent";
import Events, { EventsOf, IEventBuses } from "Events";
import Canvas from "ui/Canvas";
import Style, { IStyle, StyleProperty } from "ui/element/Style";
import Bound from "util/decorator/Bound";

export interface IElementEvents {
	changeStyle (style: Style): any;
	refresh (): any;
	reflow (): any;
	needsReflow (): any;
	render (): any;
	needsRender (): any;
	dispose (): any;
}

export interface IElementInfo {
	width: number;
	height: number;
}

let id = 0;
export default abstract class Element<INFO extends IElementInfo = IElementInfo> extends EventHost(Events)<IElementEvents> {

	private id = id++;

	public parent?: Element;
	private _info?: INFO;
	private _pendingInfo?: INFO;
	protected shouldReflow = false;
	public get info () {
		if (this._info === undefined || this.shouldReflow)
			this.forceReflow();

		return this._info ?? this._pendingInfo;
	}

	public get pendingInfo () {
		if (this._info === undefined || this.shouldReflow)
			this.forceReflow();

		return this._pendingInfo;
	}

	private static readonly leakMap = new Map<Class<Element>, Set<Element>>();

	public constructor () {
		super();
		let set = Element.leakMap.get(this.constructor);
		if (!set)
			Element.leakMap.set(this.constructor, set = new Set());
		set.add(this);
	}

	private style?: Style;
	public getStyle<P extends keyof IStyle> (property: P): IStyle[P] {
		return this.style?.get(property)
			?? this.parent?.getStyle(property)
			?? Style.DEFAULT[property];
	}

	public setStyle<P extends keyof IStyle> (property: P, value: IStyle[P] | "inherit") {
		if (!this.style && value !== "inherit") {
			const style = this.style = new Style();
			this.event.emit("changeStyle", style);
			this.event.until(["changeStyle", "dispose"], subscriber => subscriber
				.subscribe(style, "change", this.onChangeStyle));
		}

		if (this.style) {
			if (value === "inherit")
				this.style.remove(property);
			else
				this.style.set(property, value);
		}

		return this;
	}

	@Bound private onChangeStyle (api: IEventApi<Style>, property: StyleProperty) {
		switch (property.name) {
			case "color":
			case "shadow":
				return this.markNeedsRerender();
			case "scale":
				return this.markNeedsReflow();
		}
	}

	protected abstract refresh (): void;

	protected abstract reflow (): INFO;

	@Bound public markNeedsReflow () {
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
	@Bound public markNeedsRerender () {
		if (!this.shouldRerender) {
			this.shouldRerender = true;
			this.event.emit("needsRender");
		}
		return this;
	}

	private rendered?: Promise<void>;
	public getImage () {
		if (!this.generating) {
			if (this.shouldReflow)
				this.forceReflow();

			if (!this.image || this.shouldRerender)
				this.rendered = this.generateImage();
		}

		return this.image;
	}

	public forceRefresh () {
		this.refresh();
		this.event.emit("refresh");
	}

	public forceReflow () {
		this._pendingInfo = this.reflow();
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
		const info = this._pendingInfo!;
		const { width, height } = info;
		if (width !== 0 && height !== 0) {
			result.setSize(width, height);

			await this.render(result, info);

			this.image = result;
			this._info = this._pendingInfo;
			this.shouldRerender = false;
			this.event.emit("render");
		}

		this.generating = false;
	}

	protected abstract render (canvas: Canvas, info: INFO): Promise<void>;

	private disposed = false;
	public dispose () {
		if (!this.disposed) {
			this.disposed = true;
			this.event.emit("dispose");
			Element.leakMap.get(this.constructor)!.delete(this);
		}
		return this;
	}

	public setRefreshOn<ON extends EventBusOrHost<IEventBuses>, EVENT extends keyof EventsOf<ON, IEventBuses>> (on: ON, event: EVENT, when?: () => boolean) {
		this.event.until("dispose", subscriber => subscriber
			.subscribe(on, event, ((api: IEventApi<any, any>) => {
				if (when?.() !== false)
					this.forceRefresh();
				api.disregard = true;
			}) as any));
		return this;
	}

	private values: Record<string, any> = {};
	public valueChanged (id: string, value: any) {
		if (this.values[id] === value)
			return false;

		this.values[id] = value;
		return true;
	}
}

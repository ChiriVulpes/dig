import { EventHost } from "@@wayward/excevent/Emitter";
import { Class, EventBusOrHost, IEventApi } from "@@wayward/excevent/IExcevent";
import Events, { EventsOf, IEventBuses } from "Events";
import Canvas from "ui/Canvas";
import ContainerElement from "ui/element/ContainerElement";
import Style, { INHERITED_STYLES, IStyle, StyleProperty } from "ui/element/Style";
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
		return this._info ?? this._pendingInfo;
	}

	public get renderWidth () {
		const info = this._pendingInfo ?? this._info;
		return info?.width ?? 0;
	}

	public get renderHeight () {
		const info = this._pendingInfo ?? this._info;
		return info?.height ?? 0;
	}

	public get width () {
		return this.info?.width ?? 0;
	}

	public get height () {
		return this.info?.height ?? 0;
	}

	private static readonly leakMap = new Map<Class<Element>, Set<Element>>();

	public constructor () {
		super();
		let set = Element.leakMap.get(this.constructor);
		if (!set)
			Element.leakMap.set(this.constructor, set = new Set());
		set.add(this);
	}

	public needsReflow () {
		return this.shouldReflow;
	}

	public appendTo (element: ContainerElement) {
		element.append(this);
		return this;
	}

	private style?: Style;
	public getStyle<P extends keyof IStyle> (property: P): IStyle[P] {
		return this.style?.get(property)
			?? (INHERITED_STYLES[property] ? this.parent?.getStyle(property) : undefined)
			?? Style.DEFAULT[property];
	}

	public setStyle<P extends keyof IStyle> (property: P, value?: IStyle[P]) {
		if (!this.style && value !== undefined) {
			const style = this.style = new Style();
			this.event.emit("changeStyle", style);
			this.event.until(["changeStyle", "dispose"], subscriber => subscriber
				.subscribe(style, "change", (_, property) => this.onChangeStyle(property)));
		}

		if (this.style) {
			if (value === undefined)
				this.style.remove(property);
			else
				this.style.set(property, value);
		}

		return this;
	}

	protected onChangeStyle (property: StyleProperty) {
		switch (property.name) {
			case "colour":
			case "shadow":
				this.markNeedsRerender();
				break;
			case "scale":
				this.markNeedsReflow();
				break;
			case "margin":
				// make parent element reflow
				this.event.emit("needsReflow");
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
			if (this.shouldReflow || !this.info)
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
		}

		this.image = result;
		this._info = this._pendingInfo;
		this.shouldRerender = false;
		this.event.emit("render");
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

	public setRenderOn<ON extends EventBusOrHost<IEventBuses>, EVENT extends keyof EventsOf<ON, IEventBuses>> (on: ON, event: EVENT, when?: () => boolean) {
		this.event.until("dispose", subscriber => subscriber
			.subscribe(on, event, ((api: IEventApi<any, any>) => {
				if (when?.() !== false)
					this.markNeedsRerender();
				api.disregard = true;
			}) as any));
		return this;
	}
}

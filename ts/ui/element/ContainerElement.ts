import { EventHost } from "@@wayward/excevent/Emitter";
import Element, { IElementInfo } from "ui/element/Element";
import Text from "ui/element/Text";
import Bound from "util/decorator/Bound";
import { ArrayOr, GetterOfOr } from "util/type";

export const SYMBOL_NEWLINE = Symbol("LAYOUT_NEWLINE");

export type Child = Element | typeof SYMBOL_NEWLINE;
export type ResolveableChild = GetterOfOr<ArrayOr<Child | string | undefined>>;

export default abstract class ContainerElement<INFO extends IElementInfo = IElementInfo> extends Element<INFO> {

	protected children: Child[] = [];
	protected pendingChildren?: Child[];
	protected readonly unresolvedChildren: ResolveableChild[] = [];

	protected override refresh () {
		const children: Child[] = [];
		for (let child of this.unresolvedChildren) {
			if (typeof child === "function")
				child = child();

			if (!Array.isArray(child))
				child = [child];

			for (let subChild of child) {
				if (typeof subChild === "string")
					subChild = new Text(subChild);

				if (subChild)
					children.push(subChild);
			}
		}

		// dispose old pending children
		for (const child of this.pendingChildren ?? [])
			if (!children.includes(child))
				(child as Partial<Element>).dispose?.();

		this.pendingChildren = children;

		for (const child of this.pendingChildren ?? this.children) {
			(child as Partial<Element>).forceRefresh?.();
			if (child instanceof Element)
				child.parent = this;
		}

		this.markNeedsReflow();
	}

	protected override reflow () {
		for (const child of this.pendingChildren ?? this.children)
			(child as Partial<Element>).forceReflow?.();

		return this.flow();
	}

	protected abstract flow (): INFO;

	private deferredContainer: ContainerElement = this;
	protected setDeferredContainer (container: ContainerElement = this) {
		this.deferredContainer = container;
		return this;
	}

	public add (...elements: ResolveableChild[]) {
		this.deferredContainer.addInternal(...elements);
		return this;
	}

	private addInternal (...elements: ResolveableChild[]) {
		this.unresolvedChildren.push(...elements);
		for (const element of elements)
			if (element instanceof Element)
				element.parent = this;

		this.forceRefresh();
		return this;
	}

	public empty () {
		this.deferredContainer.clearInternal();
		return this;
	}

	private clearInternal (fullClear = false) {
		this.markNeedsReflow();
		for (const children of [this.pendingChildren, this.unresolvedChildren, ...fullClear ? [this.children] : []])
			for (const child of children ?? [])
				(child as Partial<Element> | undefined)?.dispose?.();

		this.unresolvedChildren.splice(0, Infinity);
		delete this.pendingChildren;
		return this;
	}

	@EventHost.Handler(ContainerElement, "reflow")
	protected onReflow () {
		for (const child of this.pendingChildren ?? this.children) {
			if (child instanceof Element) {
				child.event
					.subscribe("needsReflow", this.markNeedsReflow)
					.subscribe("needsRender", this.markNeedsRerender);

				Promise.race([
					this.event.waitFor("dispose"),
					child.event.waitFor("dispose"),
				])
					.then(() => child.event
						.unsubscribe("needsReflow", this.markNeedsReflow)
						.unsubscribe("needsRender", this.markNeedsRerender));
			}
		}
	}

	@EventHost.Handler(ContainerElement, "dispose")
	protected onDispose () {
		this.clearInternal(true);
	}

	@EventHost.Handler(ContainerElement, "render")
	protected onRender () {
		if (!this.pendingChildren)
			return;

		for (const child of this.children)
			if (!this.pendingChildren.includes(child))
				(child as Partial<Element>).dispose?.();

		this.children = this.pendingChildren ?? [];
		delete this.pendingChildren;
	}

	public override forceRefresh () {
		this.refreshInternal.debounce(1);
	}

	@Bound private refreshInternal () {
		super.forceRefresh();
	}
}

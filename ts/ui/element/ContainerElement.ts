import { EventHost } from "@@wayward/excevent/Emitter";
import Element, { IElementInfo } from "ui/element/Element";
import { ArrayOr, GetterOfOr } from "util/type";

export const SYMBOL_NEWLINE = Symbol("LAYOUT_NEWLINE");

export type Child = Element | typeof SYMBOL_NEWLINE;
export type ResolveableChild = GetterOfOr<ArrayOr<Child | undefined>>;

function childrenEquals (childrenA: Child[], childrenB: Child[]) {
	if (childrenA.length !== childrenB.length)
		return false;

	for (let i = 0; i < childrenA.length; i++)
		if (!Element.equals(childrenA[i], childrenB[i]))
			return false;

	return true;
}

export default abstract class ContainerElement<INFO extends IElementInfo = IElementInfo> extends Element<INFO> {

	protected readonly children: Child[] = [];
	protected pendingChildren?: Child[];
	protected readonly unresolvedChildren: ResolveableChild[] = [];

	protected override refresh () {
		const children: Child[] = [];
		for (let child of this.unresolvedChildren) {
			if (typeof child === "function")
				child = child();

			if (!Array.isArray(child))
				child = [child];

			for (const subChild of child)
				if (subChild)
					children.push(subChild);
		}

		if (!childrenEquals(children, this.pendingChildren ?? this.children))
			this.pendingChildren = children;

		for (const child of this.pendingChildren ?? this.children)
			(child as Partial<Element>).forceRefresh?.();

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
		this.markNeedsRefresh();
		return this;
	}

	public empty () {
		this.deferredContainer.clearInternal();
		return this;
	}

	private clearInternal () {
		this.markNeedsReflow();
		this.unresolvedChildren.splice(0, Infinity);
		this.children.splice(0, Infinity);
		return this;
	}

	@EventHost.Handler(ContainerElement, "reflow")
	protected onReflow () {
		for (const child of this.pendingChildren ?? this.children)
			(child as Partial<Element>).event?.until(this, "reflow", initialiser => initialiser
				.subscribe("needsRefresh", () => this.markNeedsRefresh())
				.subscribe("needsReflow", () => this.markNeedsReflow())
				.subscribe("needsRender", () => this.markNeedsRerender()));
	}

	protected override equals (element: ContainerElement) {
		if (this.children.length !== element.children.length)
			return false;

		for (let i = 0; i < this.children.length; i++)
			if (!Element.equals(this.children[i], element.children[i]))
				return false;

		return true;
	}
}

import Canvas from "ui/Canvas";
import ContainerElement from "ui/element/ContainerElement";
import Element, { IElementInfo } from "ui/element/Element";

export default class AbsoluteContainerElement extends ContainerElement {

	// override this so that we don't reflow children
	protected override reflow () {
		for (const child of this.pendingChildren ?? this.children)
			if ((child as Partial<Element>).needsReflow?.())
				(child as Partial<Element>).forceReflow?.();

		return this.flow();
	}

	protected override flow () {
		const maxWidth = this.getStyle("maxWidth");
		const maxHeight = this.getStyle("maxHeight");
		if (maxWidth === Infinity || maxHeight === Infinity) {
			console.warn(`AbsoluteContainerElement is missing either maxWidth (${maxWidth}) or maxHeight (${maxHeight})`, this);
			return {
				width: 0,
				height: 0,
			};
		}

		return {
			width: maxWidth,
			height: maxHeight,
		};
	}

	protected override async render (canvas: Canvas, info: IElementInfo) {
		let { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = this.getStyle("padding");
		paddingTop ??= 0;
		paddingRight ??= 0;
		paddingBottom ??= 0;
		paddingLeft ??= 0;

		const children = this.pendingChildren ?? this.children;
		for (const element of children) {
			if (!(element instanceof Element))
				continue;

			let margin = element.getStyle("margin");
			if (typeof margin === "function")
				margin = margin(element, this);

			const { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft } = margin;

			let x: number;
			if (marginLeft === undefined && marginRight !== undefined)
				x = info.width - element.renderWidth - paddingRight - marginRight;
			else
				x = paddingLeft + (marginLeft ?? 0);

			let y: number;
			if (marginTop === undefined && marginBottom !== undefined)
				y = info.height - element.renderHeight - paddingBottom - marginBottom;
			else
				y = paddingTop + (marginTop ?? 0);

			await element.waitForRendered?.();
			element.draw?.(canvas, x, y);
		}
	}
}

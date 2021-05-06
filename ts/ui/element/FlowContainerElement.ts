import Canvas from "ui/Canvas";
import ContainerElement, { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import Element, { IElementInfo } from "ui/element/Element";
import { Align, StyleProperty } from "ui/element/Style";
import { Size } from "util/Geometry";

interface ILine {
	index: number;
	dimensions: Size;
}

export interface IFlowContainerInfo extends IElementInfo {
	width: number;
	height: number;
	lines: ILine[];
}

export default class FlowContainerElement extends ContainerElement<IFlowContainerInfo> {

	protected override flow () {
		const maxWidth = this.getStyle("maxWidth");
		const maxHeight = this.getStyle("maxHeight");
		let { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = this.getStyle("padding");
		paddingTop ??= 0;
		paddingRight ??= 0;
		paddingBottom ??= 0;
		paddingLeft ??= 0;

		const maxContentWidth = maxWidth - paddingLeft - paddingRight;
		const maxContentHeight = maxHeight - paddingTop - paddingBottom;

		const children = this.pendingChildren ?? this.children;

		let width = 0;
		let lineHeight = 0;
		let lineWidth = 0;
		let height = 0;
		let needsToAddSplit = false;
		let lines: ILine[] = [];
		for (let i = 0; i < children.length; i++) {
			const element = children[i] as Partial<Element>;

			const elementWidth = element.renderWidth ?? 0;
			const elementHeight = element.renderHeight ?? 0;
			const isNewline = element === SYMBOL_NEWLINE;

			if (isNewline) {
				if (needsToAddSplit || isNewline) {
					if (isNewline)
						lines.push({ index: i, dimensions: [0, 0] });
					lines[lines.length - 1].index = i;
				}
				needsToAddSplit = false;
			}

			if (lineWidth + elementWidth > maxContentWidth || isNewline) {
				height += lineHeight;
				width = Math.max(lineWidth, width);

				if (!isNewline)
					lines.push({ index: -1, dimensions: [lineWidth, lineHeight] });
				lines[lines.length - 1].dimensions = [lineWidth, lineHeight];

				lineWidth = 0;
				lineHeight = 0;
				needsToAddSplit = !isNewline; // we've already added the split for newlines, but otherwise split at the next space
			}

			lineWidth += elementWidth;
			lineHeight = Math.max(lineHeight, elementHeight);

			if (elementWidth > maxContentWidth)
				console.warn("Element overflowing horizontally:", element);
		}

		width = Math.max(lineWidth, width);
		height += lineHeight;
		lines.push({ index: Infinity, dimensions: [lineWidth, lineHeight] });

		if (height > maxContentHeight)
			console.warn("Elements overflowing vertically:", ...children);

		return {
			lines,
			width: Math.min(maxWidth, width + paddingLeft + paddingRight),
			height: Math.min(maxHeight, height + paddingTop + paddingBottom),
		};
	}

	protected override async render (canvas: Canvas, info: IFlowContainerInfo) {
		const children = this.pendingChildren ?? this.children;
		const lines = info.lines;
		let x: number | undefined;
		let y = 0;
		let splitIndex = 0;
		for (let i = 0; i < children.length; i++) {
			const line = lines[splitIndex];
			const [lineWidth, lineHeight] = line?.dimensions ?? [0, 0];

			if (x === undefined) {
				switch (this.getStyle("align")) {
					case Align.Left:
						x = 0;
						break;
					case Align.Centre:
						x = canvas.width / 2 - lineWidth / 2;
						break;
					case Align.Right:
						x = canvas.width - lineWidth;
						break;
				}
			}

			const element = children[i] as Partial<Element>;
			const isNewline = element === SYMBOL_NEWLINE;
			const width = element.renderWidth ?? 0;
			if (!isNewline && width) {
				await element.waitForRendered?.();
				element.draw?.(canvas, x, y);
			}

			x += width;
			if (line?.index === i) {
				splitIndex++;
				x = undefined;
				y += lineHeight;
			}
		}
	}

	protected override onChangeStyle (property: StyleProperty) {
		switch (property.name) {
			case "align":
				this.markNeedsRerender();
				break;
			case "maxWidth":
			case "maxHeight":
			case "padding":
				this.markNeedsReflow();
				break;
			default:
				super.onChangeStyle(property);
		}
	}
}

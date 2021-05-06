import Canvas from "ui/Canvas";
import ContainerElement, { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import Element, { IElementInfo } from "ui/element/Element";
import { Align } from "ui/element/Style";
import { Size } from "util/Geometry";

interface ILine {
	index: number;
	dimensions: Size;
}

export interface IFlowLayoutInformation extends IElementInfo {
	width: number;
	height: number;
	lines: ILine[];
}

export default class FlowContainerElement extends ContainerElement<IFlowLayoutInformation> {

	protected container?: Size;
	public setContainedDimensions (...size: Size) {
		this.container = size;
		this.markNeedsReflow();
		return this;
	}

	protected override flow () {
		const [maxWidth, maxHeight] = this.container ?? [Infinity, Infinity];
		const children = this.pendingChildren ?? this.children;

		let width = 0;
		let lineHeight = 0;
		let lineWidth = 0;
		let height = 0;
		let needsToAddSplit = false;
		let lines: ILine[] = [];
		for (let i = 0; i < children.length; i++) {
			const element = children[i] as Partial<Element>;

			const info = element.pendingInfo ?? element.info;
			const elementWidth = info?.width ?? 0;
			const elementHeight = info?.height ?? 0;
			const isNewline = element === SYMBOL_NEWLINE;

			if (isNewline) {
				if (needsToAddSplit || isNewline) {
					if (isNewline)
						lines.push({ index: i, dimensions: [0, 0] });
					lines[lines.length - 1].index = i;
				}
				needsToAddSplit = false;
			}

			if (lineWidth + elementWidth > maxWidth || isNewline) {
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

			if (elementWidth > maxWidth)
				console.warn("Element overflowing horizontally:", element);
		}

		width = Math.max(lineWidth, width);
		height += lineHeight;
		lines.push({ index: Infinity, dimensions: [lineWidth, lineHeight] });

		if (height > maxHeight)
			console.warn("Elements overflowing vertically:", ...children);

		return {
			lines,
			width,
			height,
		};
	}

	protected override async render (canvas: Canvas, info: IFlowLayoutInformation) {
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
			const width = (element.pendingInfo ?? element.info)?.width ?? 0;
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
}
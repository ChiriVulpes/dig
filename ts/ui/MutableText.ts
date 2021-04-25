import { Color } from "../util/Color";
import Canvas from "./Canvas";
import { Align, Text } from "./Text";

export class MutableText {

	private text?: Text;
	private color = Color.WHITE;
	private maxWidth = Infinity;
	private scale = 1;
	private align = Align.Left;

	public constructor (private getter: () => string) {
		this.refresh();
	}

	public setText (getter: () => string) {
		this.getter = getter;
		this.refresh();
		return this;
	}

	public setColor (color: Color) {
		this.color = color;
		this.refresh();
		return this;
	}

	public setMaxWidth (width: number) {
		this.maxWidth = width;
		this.refresh();
		return this;
	}

	public setScale (scale: number) {
		this.scale = scale;
		this.refresh();
		return this;
	}

	public setAlign (align: Align) {
		this.align = align;
		this.refresh();
		return this;
	}

	public refresh () {
		const text = this.getter();
		const shouldRefresh = this.text?.text !== text
			|| this.color !== this.text?.color
			|| this.maxWidth !== this.text?.maxWidth
			|| this.scale !== this.text?.scale
			|| this.align !== this.text.align;

		if (shouldRefresh) {
			if (!text.length) {
				delete this.text;
				return;
			}

			const newText = new Text(text, this.color, this.maxWidth, this.scale, this.align);
			newText.waitForRendered().then(() => this.text = newText);
		}
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.refresh();
		this.text?.render(canvas, x, y);
	}

	public getLayout () {
		return this.text?.getLayout();
	}
}

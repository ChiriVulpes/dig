import { Color } from "../util/Color";
import Canvas from "./Canvas";
import { Text } from "./Text";

export class MutableText {

	private text?: Text;
	private color = Color.WHITE;
	private maxWidth = Infinity;

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

	public refresh () {
		const text = this.getter();
		const shouldRefresh = this.text?.text !== text
			|| this.color !== this.text?.color
			|| this.maxWidth !== this.text?.maxWidth;

		if (shouldRefresh) {
			const newText = new Text(text, this.color, this.maxWidth);
			newText.waitForRendered().then(() => this.text = newText);
		}
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.refresh();
		this.text?.render(canvas, x, y);
	}

}

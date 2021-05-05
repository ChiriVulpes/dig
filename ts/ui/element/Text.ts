import Canvas from "ui/Canvas";
import Element from "ui/element/Element";
import Sprite from "ui/Sprite";
import { Color } from "util/Color";
import Enums from "util/Enums";
import { GetterOfOr } from "util/type";

const CHAR_WIDTH = 6;
const CHAR_HEIGHT = 9;

enum FontSprite {
	Uppercase,
	Lowercase,
	Numbers,
	Period,
	Comma,
	Exclamation,
	Colon,
	Parentheses,
	Currency,
	Plus,
	Minus,
}

interface IFontSpriteCharacterRange {
	start: number;
	end: number;
}

type FontSpriteDefinition = IFontSpriteCharacterRange | number;

const fontSpriteDefinitions: Record<FontSprite, FontSpriteDefinition> = {
	[FontSprite.Uppercase]: { start: "A".charCodeAt(0), end: "Z".charCodeAt(0) },
	[FontSprite.Lowercase]: { start: "a".charCodeAt(0), end: "z".charCodeAt(0) },
	[FontSprite.Numbers]: { start: "0".charCodeAt(0), end: "9".charCodeAt(0) },
	[FontSprite.Parentheses]: { start: "(".charCodeAt(0), end: ")".charCodeAt(0) },
	[FontSprite.Period]: ".".charCodeAt(0),
	[FontSprite.Comma]: ",".charCodeAt(0),
	[FontSprite.Exclamation]: "!".charCodeAt(0),
	[FontSprite.Colon]: ":".charCodeAt(0),
	[FontSprite.Currency]: "$".charCodeAt(0),
	[FontSprite.Plus]: "+".charCodeAt(0),
	[FontSprite.Minus]: "-".charCodeAt(0),
};

const characterWidthExceptions: Partial<Record<string, number>> = {
	I: 5,
	T: 5,
	i: 3,
	j: 5,
	l: 4,
	r: 5,
	1: 5,
	",": 3,
	".": 3,
	"!": 3,
	":": 3,
	"(": 4,
	")": 4,
	"+": 5,
	"-": 5,
	"\n": 0,
};

const SVG = "http://www.w3.org/2000/svg";

export default class Text extends Element {

	private text!: string;
	private getter?: () => string;

	public constructor (text: GetterOfOr<string>) {
		super();
		this.setText(text);
	}

	public setText (text: GetterOfOr<string>) {
		if (typeof text === "function") {
			this.getter = text;
			this.forceRefresh();
		} else {
			this.text = text;
			this.markNeedsReflow();
		}

		return this;
	}

	protected equals (element: Text) {
		return this.text === element.text;
	}

	protected override refresh () {
		const text = this.getter?.() ?? this.text;
		if (text === this.text)
			return;

		this.text = text;
		this.markNeedsReflow();
	}

	protected override reflow () {
		return {
			width: this.calculateWidth(),
			height: CHAR_HEIGHT * this.getStyle("scale"),
		};
	}

	protected override async render (canvas: Canvas) {
		const scale = this.getStyle("scale");
		const color = this.getStyle("color");
		const shadow = this.getStyle("shadow");
		await this.renderText(canvas, shadow, scale, 1);
		await this.renderText(canvas, color, scale);
	}

	private async renderText (canvas: Canvas, color: Color, scale: number, y = 0) {
		const isWhite = Color.equals(color, Color.WHITE);
		let svg: SVGSVGElement | undefined;
		if (!isWhite) {
			svg = document.createElementNS(SVG, "svg");
			const filter = document.createElementNS(SVG, "filter");
			filter.id = color.getID();
			const matrix = document.createElementNS(SVG, "feColorMatrix");
			matrix.setAttribute("type", "matrix");
			matrix.setAttribute("color-interpolation-filters", "sRGB");
			matrix.setAttribute("values", color.getSVGColorMatrix());
			filter.appendChild(matrix);
			svg.appendChild(filter);
			document.body.appendChild(svg);

			canvas.context.filter = `url(#${filter.id})`;
		}

		let x = 0;
		for (let i = 0; i < this.text.length; i++) {
			const char = this.text[i];
			const code = this.text.charCodeAt(i);
			const fontSprite = this.getFontSprite(code);
			if (fontSprite !== undefined) {
				const sprite = Sprite.get(`ui/font/${FontSprite[fontSprite].toLowerCase()}`);
				await sprite.loaded;
				const def = fontSpriteDefinitions[fontSprite];
				canvas.context.imageSmoothingEnabled = false;
				sprite.render(canvas, x, y, CHAR_WIDTH * scale, CHAR_HEIGHT * scale, typeof def === "number" ? 0 : (code - def.start) * CHAR_WIDTH, 0, CHAR_WIDTH, CHAR_HEIGHT);
			}

			x += (characterWidthExceptions[char] ?? CHAR_WIDTH) * scale;
		}

		if (svg) {
			canvas.context.filter = "none";
			svg.remove();
		}
	}

	private getFontSprite (char: number) {
		for (const fontSprite of Enums.values(FontSprite)) {
			const definition = fontSpriteDefinitions[fontSprite];
			const matches = typeof definition === "number" ? definition === char
				: char >= definition.start && char <= definition.end;

			if (matches)
				return fontSprite;
		}

		return undefined;
	}

	private calculateWidth () {
		this.forceRefresh();

		let width = 0;
		for (const char of this.text)
			width += (characterWidthExceptions[char] ?? CHAR_WIDTH);

		return width * this.getStyle("scale");
	}
}

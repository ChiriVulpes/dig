import Canvas from "ui/Canvas";
import Element from "ui/element/Element";
import Sprite from "ui/Sprite";
import Colour from "util/Color";
import Enums from "util/Enums";
import { GetterOfOr } from "util/type";

const CHAR_WIDTH = 6;
const CHAR_HEIGHT = 9;

enum FontSprite {
	Wide,
	Uppercase,
	Lowercase,
	Numbers,
	Symbols,
	WideSymbols,
}

interface IFontSpriteDefinition {
	width?: number;
}

interface IFontSpriteCharacterRange extends IFontSpriteDefinition {
	start: number;
	end: number;
}

interface IFontSpriteCodeList extends IFontSpriteDefinition {
	codes: number[];
}

type FontSpriteDefinition = IFontSpriteCharacterRange | IFontSpriteCodeList | number;

function char (...chars: string[]): FontSpriteDefinition;
function char (width: number, ...chars: string[]): FontSpriteDefinition;
function char (width?: number | string, ...chars: string[]) {
	if (typeof width === "string")
		chars.unshift(width), width = undefined;

	const codes = chars.flatMap(str => str.split("")).map(char => char.charCodeAt(0));
	if (codes.length === 1)
		return codes[0];

	return { codes, width };
}

function charRange (start: string, end: string) {
	return { start: start.charCodeAt(0), end: end.charCodeAt(0) };
}

function getSpriteIndexOffset (def: FontSpriteDefinition, code: number) {
	if (typeof def === "number")
		return 0;

	const width = def.width ?? CHAR_WIDTH;
	if ("codes" in def)
		return def.codes.indexOf(code) * width;

	return (code - def.start) * width;
}

const fontSpriteDefinitions: Record<FontSprite, FontSpriteDefinition> = {
	[FontSprite.Wide]: char(9, "MmWw"),
	[FontSprite.Uppercase]: charRange("A", "Z"),
	[FontSprite.Lowercase]: charRange("a", "z"),
	[FontSprite.Numbers]: charRange("0", "9"),
	[FontSprite.Symbols]: char(".,“”‘’\"'?!_*$()+-/:;<=>[\\]^`{|}"),
	[FontSprite.WideSymbols]: char(8, "@#%&~"),
};

const characterWidthExceptions: Partial<Record<string, number>> = {
	i: 3,
	I: 5,
	j: 5,
	l: 4,
	m: 9,
	M: 9,
	r: 5,
	T: 5,
	w: 8,
	W: 8,
	1: 5,
	".": 3,
	",": 3,
	"‘": 3,
	"’": 3,
	"'": 3,
	"!": 3,
	"(": 4,
	")": 4,
	"+": 5,
	"-": 5,
	"/": 5,
	":": 3,
	";": 3,
	"<": 5,
	"=": 5,
	">": 5,
	"[": 4,
	"\\": 5,
	"]": 4,
	"^": 4,
	"`": 4,
	"{": 5,
	"|": 3,
	"}": 5,
	"@": 8,
	"#": 8,
	"%": 8,
	"&": 7,
	"~": 8,
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
		const colour = this.getStyle("colour");
		const shadow = this.getStyle("shadow");
		await this.renderText(canvas, shadow, scale, 1);
		await this.renderText(canvas, colour, scale);
	}

	private async renderText (canvas: Canvas, colour: Colour, scale: number, y = 0) {
		const isWhite = Colour.equals(colour, Colour.WHITE);
		let svg: SVGSVGElement | undefined;
		if (!isWhite) {
			svg = document.createElementNS(SVG, "svg");
			const filter = document.createElementNS(SVG, "filter");
			filter.id = colour.getID();
			const matrix = document.createElementNS(SVG, "feColorMatrix");
			matrix.setAttribute("type", "matrix");
			matrix.setAttribute("color-interpolation-filters", "sRGB");
			matrix.setAttribute("values", colour.getSVGColorMatrix());
			filter.appendChild(matrix);
			svg.appendChild(filter);
			document.body.appendChild(svg);

			canvas.context.filter = `url(#${filter.id})`;
		}

		let x = 0;
		for (let i = 0; i < this.text.length; i++) {
			const char = this.text[i];
			const code = this.text.charCodeAt(i);
			const width = characterWidthExceptions[char] ?? CHAR_WIDTH;
			const fontSprite = this.getFontSprite(code);
			if (fontSprite !== undefined) {
				const sprite = Sprite.get(`ui/font/${FontSprite[fontSprite].toLowerCase()}`);
				await sprite.loaded;
				const def = fontSpriteDefinitions[fontSprite];
				const index = getSpriteIndexOffset(def, code);
				canvas.context.imageSmoothingEnabled = false;
				sprite.render(canvas, x, y, width * scale, CHAR_HEIGHT * scale, index, 0, width, CHAR_HEIGHT);
			}

			x += width * scale;
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
				: "codes" in definition ? definition.codes.includes(char)
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

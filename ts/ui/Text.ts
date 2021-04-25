import { Color } from "../util/Color";
import Enums from "../util/Enums";
import Canvas from "./Canvas";
import Sprite from "./Sprite";

const CHAR_WIDTH = 6;
const CHAR_HEIGHT = 9;

enum FontSprite {
	Uppercase,
	Lowercase,
	Numbers,
	Period,
	Comma,
	Exclamation,
	Colon
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
	[FontSprite.Period]: ".".charCodeAt(0),
	[FontSprite.Comma]: ",".charCodeAt(0),
	[FontSprite.Exclamation]: "!".charCodeAt(0),
	[FontSprite.Colon]: ":".charCodeAt(0),
};

const characterWidthExceptions: Partial<Record<string, number>> = {
	I: 5,
	T: 5,
	i: 3,
	j: 5,
	l: 5,
	r: 5,
	1: 5,
	",": 3,
	".": 3,
	"!": 3,
	":": 3,
};

const SVG = "http://www.w3.org/2000/svg";

export class Text {

	private image?: Canvas;
	private generating = false;

	public constructor (public readonly text: string, public readonly color: Color, public readonly maxWidth = Infinity) {
	}

	private layout?: [width: number, height: number, splits: Set<number>];
	public getLayout () {
		if (!this.layout) {
			let width = 0;
			let lineWidth = 0;
			let wordWidth = 0;
			let height = CHAR_HEIGHT;
			let needsToAddSplit = false;
			let splits = new Set<number>();
			for (let i = 0; i < this.text.length; i++) {
				const char = this.text[i];

				if (char === " " || char === "\n") {
					lineWidth += wordWidth;
					wordWidth = 0;
					if (needsToAddSplit || char === "\n")
						splits.add(i);
					needsToAddSplit = false;
				}

				const charWidth = characterWidthExceptions[char] ?? CHAR_WIDTH;
				wordWidth += charWidth;

				if (lineWidth + wordWidth > this.maxWidth || char === "\n") {
					height += CHAR_HEIGHT;
					width = Math.max(lineWidth, width);
					lineWidth = 0;
					needsToAddSplit = char !== "\n"; // we've already added the split for newlines, but otherwise split at the next space
				}
			}

			lineWidth += wordWidth;
			width = Math.max(lineWidth, width);

			height++; // we render a shadow
			this.layout = [width, height, splits];
		}

		return this.layout;
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.getImage()?.render(canvas, x, y);
	}

	private rendered?: Promise<void>;
	public getImage () {
		if (!this.image && !this.generating) {
			this.generating = true;
			this.rendered = this.generateImage();
		}

		return this.image;
	}

	public waitForRendered () {
		this.getImage();
		return this.rendered!;
	}

	private async generateImage () {
		const result = new Canvas();
		const [width, height, splits] = this.getLayout();
		result.setSize(width, height);

		const shadow = new Canvas();
		shadow.setSize(width, height);
		await this.renderText(shadow, 1, splits, Color.BLACK);

		const top = new Canvas();
		top.setSize(width, height);
		await this.renderText(top, 0, splits);

		shadow.render(result);
		top.render(result);

		this.image = result;
	}

	private async renderText (canvas: Canvas, y: number, splits: Set<number>, color = this.color) {
		const svg = document.createElementNS(SVG, "svg");
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

		let x = 0;
		for (let i = 0; i < this.text.length; i++) {
			const char = this.text[i];
			if (char !== " " && char !== "\n") {
				const code = this.text.charCodeAt(i);
				const fontSprite = this.getFontSprite(code);
				if (fontSprite !== undefined) {
					const sprite = Sprite.get(`ui/font/${FontSprite[fontSprite].toLowerCase()}`);
					await sprite.loaded;
					const def = fontSpriteDefinitions[fontSprite];
					sprite.render(canvas, x, y, typeof def === "number" ? 0 : (code - def.start) * CHAR_WIDTH, 0, CHAR_WIDTH, CHAR_HEIGHT);
				}
			}

			x += characterWidthExceptions[char] ?? CHAR_WIDTH;
			if (splits.has(i)) {
				x = 0;
				y += CHAR_HEIGHT;
			}
		}

		canvas.context.filter = "none";
		svg.remove();
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
}

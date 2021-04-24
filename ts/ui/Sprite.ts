import Canvas from "./Canvas";

export default class Sprite {
	private static readonly sprites = new Map<string, Sprite>();

	public static get (name: string) {
		let sprite = this.sprites.get(name);
		if (!sprite)
			this.sprites.set(name, sprite = new Sprite(name));

		return sprite;
	}

	public image?: HTMLImageElement;
	public pattern?: CanvasPattern;

	public constructor (public readonly name: string) {
		const image = document.createElement("img");
		image.src = `sprite/${name}.png`;
		image.addEventListener("load", () => this.image = image);
	}

	public render (canvas: Canvas, x: number, y: number): void;
	public render (canvas: Canvas, x: number, y: number, sx: number, sy: number, w: number, h: number): void;
	public render (canvas: Canvas, x: number, y: number, sx?: number, sy?: number, w?: number, h?: number) {
		if (!this.image)
			return;

		if (sx === undefined)
			canvas.context.drawImage(this.image, x, y);
		else
			canvas.context.drawImage(this.image, sx, sy!, w!, h!, x, y, w!, h!);
	}

	public renderTiled (canvas: Canvas, x: number, y: number) {
		if (!this.image)
			return;

		if (!this.pattern)
			this.pattern = canvas.context.createPattern(this.image, "repeat")!;

		this.pattern.setTransform(new DOMMatrix().translate(x, y));
		canvas.context.fillStyle = this.pattern;
		canvas.context.fillRect(x, y, canvas.width, canvas.height);
	}
}

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

	public constructor (public readonly name: string) {
		const image = document.createElement("img");
		image.src = `sprite/${name}.png`;
		image.addEventListener("load", () => this.image = image);
	}

	public render (canvas: Canvas, x: number, y: number) {
		if (!this.image)
			return;

		canvas.context.drawImage(this.image, x, y);
	}
}

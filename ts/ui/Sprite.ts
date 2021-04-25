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
	public loaded: Promise<void>;

	public get width () {
		return this.image?.width ?? 0;
	}

	public get height () {
		return this.image?.height ?? 0;
	}

	public constructor (public readonly name: string) {
		const image = document.createElement("img");

		this.loaded = new Promise<void>(resolve => {
			image.addEventListener("load", () => {
				this.image = image;
				resolve();
			});
		});

		image.src = `sprite/${name}.png`;
	}

	public render (canvas: Canvas, x: number, y: number): void;
	public render (canvas: Canvas, x: number, y: number, sx: number, sy: number, w: number, h: number): void;
	public render (canvas: Canvas, x: number, y: number, w: number, h: number, sx: number, sy: number, sw: number, sh: number): void;
	public render (canvas: Canvas, x: number, y: number, w?: number, h?: number, sx?: number, sy?: number, sw?: number, sh?: number) {
		if (!this.image)
			return;

		if (w === undefined)
			canvas.context.drawImage(this.image, x, y);
		else if (sw === undefined)
			canvas.context.drawImage(this.image, w, h!, sx!, sy!, x, y, sx!, sy!);
		else
			canvas.context.drawImage(this.image, sx!, sy!, sw, sh!, x, y, w, h!);
	}
}

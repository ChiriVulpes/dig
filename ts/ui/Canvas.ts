export default class Canvas {

	private readonly element = document.createElement("canvas");
	public readonly context = this.element.getContext("2d")!;

	public get width () {
		return this.element.width;
	}

	public get height () {
		return this.element.height;
	}

	public constructor () {
	}

	public appendTo (element: HTMLElement) {
		element.appendChild(this.element);
		return this;
	}

	public setSize (width: number, height: number) {
		this.element.width = width;
		this.element.height = height;
		return this;
	}

	private displaySize?: { x: number, y: number };

	public setDisplaySize (width: number, height: number) {
		this.element.style.setProperty("--width", `${width}`);
		this.element.style.setProperty("--height", `${height}`);
		this.displaySize = { x: width, y: height };
		return this;
	}

	public getDisplaySize () {
		return this.displaySize;
	}

	public clear () {
		this.context.clearRect(0, 0, this.element.width, this.element.height);
		return this;
	}

	private offset?: { x: number, y: number };

	public getOffset () {
		if (!this.offset)
			this.offset = { x: this.element.offsetLeft, y: this.element.offsetTop };

		return this.offset;
	}

	public invalidateOffset () {
		delete this.offset;
	}

	public render (canvas: Canvas) {
		canvas.context.drawImage(this.element, 0, 0);
	}
}

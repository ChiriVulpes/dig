export default class Canvas {

	private readonly element = document.createElement("canvas");
	public readonly context = this.element.getContext("2d")!;

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

	public setDisplaySize (width: number, height: number) {
		this.element.style.setProperty("--width", `${width}`);
		this.element.style.setProperty("--height", `${height}`);
		return this;
	}

	public clear () {
		this.context.clearRect(0, 0, this.element.width, this.element.height);
		return this;
	}
}

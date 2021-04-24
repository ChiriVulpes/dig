export default class Canvas {

	private readonly canvas = document.createElement("canvas");
	public readonly context = this.canvas.getContext("2d");

	public constructor () {
		document.body.append(this.canvas);
	}
}

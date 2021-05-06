export default class Colour {

	public static readonly BLACK = new Colour(0, 0, 0);
	public static readonly WHITE = new Colour(255, 255, 255);

	public constructor (public readonly red: number, public readonly green: number, public readonly blue: number) {
	}

	public getID () {
		return `color0x${this.toInt().toString(16).padStart(6, "0")}`;
	}

	public getSVGColorMatrix () {
		return `${this.red / 255} 0 0 0 0 0 ${this.green / 255} 0 0 0 0 0 ${this.blue / 255} 0 0 0 0 0 1 0`;
	}

	public static fromInt (int: number): Colour {
		return new Colour((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF);
	}

	public toInt () {
		let int = this.red;
		int = (int << 8) + this.green;
		int = (int << 8) + this.blue;
		return int;
	}

	public static equals (color1: Colour, color2: Colour) {
		return color1.red === color2.red
			&& color1.green === color2.green
			&& color1.blue === color2.blue;
	}
}

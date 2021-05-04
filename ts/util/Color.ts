
export class Color {

	public static readonly BLACK = new Color(0, 0, 0);
	public static readonly WHITE = new Color(255, 255, 255);

	public constructor (public readonly red: number, public readonly blue: number, public readonly green: number) {
	}

	public getID () {
		return `color0x${this.toInt().toString(16).padStart(6, "0")}`;
	}

	public getSVGColorMatrix () {
		return `${this.red / 255} 0 0 0 0 0 ${this.green / 255} 0 0 0 0 0 ${this.blue / 255} 0 0 0 0 0 1 0`;
	}

	public static fromInt (int: number): Color {
		return new Color((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF);
	}

	public toInt () {
		let int = this.red;
		int = (int << 8) + this.green;
		int = (int << 8) + this.blue;
		return int;
	}

	public static equals (color1: Color, color2: Color) {
		return color1.red === color2.red
			&& color1.green === color2.green
			&& color1.blue === color2.blue;
	}
}

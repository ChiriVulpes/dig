export type Point = readonly [x: number, y: number];
export type Size = readonly [w: number, h: number];

export type Rectangle = readonly [...Point, ...Size];
export namespace Rectangle {
	type RectangleIntersectsParameters = [...Rectangle, ...Point, ...Size | []];
	export function intersects (...[rx, ry, rw, rh, x, y, w, h]: RectangleIntersectsParameters) {
		if (w === undefined || h === undefined)
			return x >= rx && x < rx + rw
				&& y >= ry && y < ry + rh;

		return x < rx + rw && x + w > rx
			&& y < ry + rh && y + h > ry;
	}
}

export interface IMargin {
	readonly top?: number;
	readonly right?: number;
	readonly bottom?: number;
	readonly left?: number;
}

export class Margin implements IMargin {

	public static ZERO: IMargin = new Margin(0, 0, 0, 0);
	public static AUTO: IMargin = new Margin();
	public static of (margin: number) {
		return new Margin(margin, margin, margin, margin);
	}

	public constructor (public top?: number, public right?: number, public bottom?: number, public left?: number) { }

	public setTop (top?: number) {
		this.top = top;
		return this;
	}

	public setRight (right?: number) {
		this.right = right;
		return this;
	}

	public setBottom (bottom?: number) {
		this.bottom = bottom;
		return this;
	}

	public setLeft (left?: number) {
		this.left = left;
		return this;
	}
}

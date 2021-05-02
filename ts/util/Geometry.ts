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

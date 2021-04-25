namespace Maths {
	export function lerp (from: number, to: number, t: number): number {
		return t < 0 ? from
			: t > 1 ? to
				: (1 - t) * from + t * to;
	}

	export function unlerp (from: number, to: number, lerped: number): number {
		return lerped === from ? 0 : lerped === to ? 1
			: (lerped - from) / (to - from);
	}

	export function direction (direction: number, distance = 1) {
		return [distance * Math.cos(direction), distance * Math.sin(direction)];
	}
}

export default Maths;

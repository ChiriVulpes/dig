namespace Maths {
	export function lerp (from: number, to: number, t: number): number {
		return (1 - t) * from + t * to;
	}

	export function unlerp (from: number, to: number, lerped: number): number {
		return lerped === from ? 0 : lerped === to ? 1
			: (lerped - from) / (to - from);
	}
}

export default Maths;

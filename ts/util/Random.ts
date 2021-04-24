namespace Random {

	export function int (max: number): number;
	export function int (min: number, max: number): number;
	export function int (min: number, max?: number) {
		return Math.floor(float(min, max!));
	}

	export function float (max: number): number;
	export function float (min: number, max: number): number;
	export function float (min: number, max?: number) {
		if (max === undefined) {
			max = min;
			min = 0;
		}

		if (min > max) {
			[min, max] = [max, min];
		}

		return min + Math.random() * (max - min);
	}

	export function chance (chance: number) {
		return Math.random() <= chance;
	}
}

export default Random;

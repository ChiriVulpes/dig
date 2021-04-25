namespace Random {

	export function choice<A extends any[]> (...choices: A): A[number] {
		return choices.length === 0 ? undefined : choices[int(choices.length)];
	}

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

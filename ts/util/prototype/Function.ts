declare global {
	interface Function {
		debounce (time: number): void;
	}
}

export default function () {
	Object.defineProperty(Function.prototype, "debounce", {
		value (this: ((...args: any[]) => any) & { timeout?: number }, time: number) {
			if (this.timeout !== undefined)
				clearTimeout(this.timeout);
			this.timeout = setTimeout(this, time);
		},
	})
}

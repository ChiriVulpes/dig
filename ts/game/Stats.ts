export class Stats {
	public dug!: number;

	public constructor () {
		this.reset();
	}

	public reset () {
		this.dug = 0;
		return this;
	}
}
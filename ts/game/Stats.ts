export class Stats {
	public dug!: number;
	public turn!: number;
	public tick!: number;

	public constructor () {
		this.reset();
	}

	public reset () {
		this.dug = 0;
		this.turn = 0;
		this.tick = 0;
		return this;
	}
}
export class Stats {
	public dug!: number;
	public turn!: number;
	public tick!: number;
	public exhaustion!: number;
	public score!: number;

	public constructor () {
		this.reset();
	}

	public reset () {
		this.dug = 0;
		this.turn = 0;
		this.tick = 0;
		this.exhaustion = 0;
		this.score = 0;
		return this;
	}

	public update () {
		this.tick++;

		if (this.exhaustion)
			this.exhaustion--;
	}
}
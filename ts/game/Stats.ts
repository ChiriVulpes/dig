export enum GameState {
	Surface,
	Mining,
	FellBehind,
}

export class Stats {
	public dug!: number;
	public turn!: number;
	public tick!: number;
	public exhaustion!: number;
	public score!: number;
	public state!: GameState;

	public get difficulty () {
		return this.turn / 1000;
	}

	public constructor () {
		this.reset();
	}

	public reset () {
		this.dug = 0;
		this.turn = 0;
		this.tick = 0;
		this.exhaustion = 0;
		this.score = 0;
		this.state = GameState.Surface;
		return this;
	}

	public update () {
		this.tick++;

		if (this.exhaustion)
			this.exhaustion--;
	}

	public passTurn () {
		this.turn++
		this.state = GameState.Mining;
	}

	public dig () {
		this.dug++;
		this.state = GameState.Mining;
	}
}
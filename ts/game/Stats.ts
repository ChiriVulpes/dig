export enum GameState {
	Surface,
	Mining,
	FellBehind,
}

export const NOT_DISCOVERED_EXPLOSIVES = -1;

export class Stats {
	public dug!: number;
	public turn!: number;
	public tick!: number;
	public exhaustion!: number;
	public score!: number;
	public state!: GameState;
	public explosives!: number;

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
		this.explosives = NOT_DISCOVERED_EXPLOSIVES;
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

	public addExplosive () {
		if (this.explosives === NOT_DISCOVERED_EXPLOSIVES)
			this.explosives = 0;

		this.explosives++;
	}
}
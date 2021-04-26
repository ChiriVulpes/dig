import { GameState, TILES } from "../Constants";
import { TileType } from "./Tile";

export const NOT_DISCOVERED = -1;
export const COST_ASSAY = 1000;

const LOCAL_STORAGE_KEY_SCORES = "scores";

export class Stats {
	public dug!: number;
	public turn!: number;
	public mineshaftDepth!: number;
	public tick!: number;
	public exhaustion!: number;
	public score!: number;
	public state!: GameState;
	public explosives!: number;
	public discoveredAssays!: boolean;
	public scores = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_SCORES) ?? "[]") as number[];

	public get difficulty () {
		return this.turn / 1000;
	}

	public get highscore () {
		return Math.max(0, ...this.scores);
	}

	public get assayCost () {
		return COST_ASSAY + this.turn * 10;
	}

	public get scheduledDepthDifference () {
		if (this.turn < 50)
			return 0;

		const difference = this.turn - this.dug;
		if (difference > 0)
			return difference;

		return this.mineshaftDepth - this.turn - TILES + 7;
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
		this.explosives = NOT_DISCOVERED;
		this.discoveredAssays = false;
		this.mineshaftDepth = 0;
		return this;
	}

	public update () {
		this.tick++;

		if (this.exhaustion)
			this.exhaustion--;

		if (this.score > COST_ASSAY * 5 && !this.discoveredAssays)
			this.discoveredAssays = true;
	}

	public passTurn () {
		this.turn++;
		this.state = GameState.Mining;
	}

	public dig (tileType: TileType) {
		if (tileType === TileType.Rock)
			this.dug++;
		this.state = GameState.Mining;
	}

	public addExplosive () {
		if (this.explosives === NOT_DISCOVERED)
			this.explosives = 0;

		this.explosives++;
	}

	public endGame () {
		this.state = GameState.FellBehind;
		this.scores.push(this.score);
		localStorage.setItem(LOCAL_STORAGE_KEY_SCORES, JSON.stringify(this.scores));
	}
}
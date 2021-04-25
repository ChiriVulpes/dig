import { Stats } from "../game/Stats";
import Canvas from "./Canvas";
import { Mouse } from "./Mouse";
import { MutableText } from "./MutableText";

export class Ui {

	private score = new MutableText(() => [
		`SCORE: ${this.stats.score}`,
		`DEPTH: ${this.stats.turn}`,
	].join("\n"));

	public constructor (private readonly stats: Stats, private readonly mouse: Mouse) {
	}

	public render (canvas: Canvas) {
		this.score.render(canvas, 5, 5);
	}
}

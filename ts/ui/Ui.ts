import { GameState, NOT_DISCOVERED_EXPLOSIVES, Stats } from "../game/Stats";
import Canvas from "./Canvas";
import { IMouseEventHandler } from "./Mouse";
import { MutableText } from "./MutableText";

export class Ui implements IMouseEventHandler {

	private score = new MutableText(() => [
		...this.stats.state !== GameState.FellBehind ? []
			: [
				"GAME OVER!",
				"Click anywhere to play again",
			],
		`SCORE: ${this.stats.score}`,
		`DEPTH: ${this.stats.turn}`,
		...this.stats.explosives === NOT_DISCOVERED_EXPLOSIVES ? [] : [`EXPLOSIVES: ${this.stats.explosives} (Right Click)`],
	].join("\n"));

	private title = new MutableText(() => "DIG DIG DIG")
		.setScale(4);
	private author = new MutableText(() => "by Chirichirichiri")
		.setScale(2);
	private hint = new MutableText(() => "Use the mouse to start mining!");

	public constructor (private readonly stats: Stats) {

	}

	public render (canvas: Canvas) {
		let width: number;
		let height: number;

		switch (this.stats.state) {
			case GameState.Mining:
			case GameState.FellBehind:
				[width, height] = this.score.getLayout() ?? [0, 0];
				this.score.render(canvas, 5, canvas.height - height - 2);
				break;

			case GameState.Surface:
				[width, height] = this.title.getLayout() ?? [0, 0];
				this.title.render(canvas,
					canvas.width / 2 - width / 2,
					canvas.height / 4 - height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));

				const titleXEnd = canvas.width / 2 + width / 2;
				const titleYEnd = canvas.height / 4 + height / 2;
				[width, height] = this.author.getLayout() ?? [0, 0];
				this.author.render(canvas,
					titleXEnd - width,
					titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));

				[width, height] = this.hint.getLayout() ?? [0, 0];
				this.hint.render(canvas,
					canvas.width - width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3),
					canvas.height - height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));
				break;
		}
	}

	public onMouseDown () {
		if (this.stats.state === GameState.FellBehind)
			this.stats.reset();
	}
}

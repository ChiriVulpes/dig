import Events, { EventBus } from "Events";
import { GameState } from "../Constants";
import { NOT_DISCOVERED, Stats } from "../game/Stats";
import Canvas from "./Canvas";
import { IMouseEventHandler } from "./Mouse";
import { MutableText } from "./MutableText";
import { Align } from "./Text";

@Events.Bus(EventBus.Ui)
export class Ui implements IMouseEventHandler {

	private score = new MutableText(() => [
		...this.stats.state === GameState.Surface ? [
			...!this.stats.highscore ? [] : [`Highest stock value: $${this.stats.highscore}`],
		] : [
			`Depth: ${this.stats.turn}${!this.stats.scheduledDepthDifference ? ""
				: ` (${this.stats.scheduledDepthDifference > 0 ? "+" : ""}${this.stats.scheduledDepthDifference})`}`,
			...this.stats.turn * 10 === this.stats.score ? [] : [`Stock value: $${this.stats.score}`],
		],
	].join("\n"));

	private abilities = new MutableText(() => [
		"ABILITIES: Right Click ",
		...!this.stats.discoveredAssays ? []
			: [`Assay cost: $${this.stats.assayCost}`],
		...this.stats.explosives === NOT_DISCOVERED ? []
			: [`Explosives: Have ${this.stats.explosives}`],
	].join("\n"))
		.setAlign(Align.Right);

	private title = new MutableText(() =>
		this.stats.state === GameState.Surface ? "DIG DIG DIG"
			: "GAME OVER!")
		.setScale(4);
	private author = new MutableText(() => "by Chirichirichiri")
		.setScale(2);
	private hint = new MutableText(() =>
		this.stats.state === GameState.Surface ? "Use the mouse to start mining!"
			: "Click anywhere to play again!");

	public constructor (private readonly stats: Stats) {
	}

	public render (canvas: Canvas) {
		let width: number;
		let height: number;

		if (this.stats.state !== GameState.Mining) {
			[width, height] = this.title.getLayout() ?? [0, 0];
			this.title.render(canvas,
				canvas.width / 2 - width / 2,
				canvas.height / 4 - height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));
		}

		if (this.stats.state === GameState.Surface) {
			const titleXEnd = canvas.width / 2 + width! / 2;
			const titleYEnd = canvas.height / 4 + height! / 2;
			[width, height] = this.author.getLayout() ?? [0, 0];
			this.author.render(canvas,
				titleXEnd - width,
				titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));

		}

		if (this.stats.state !== GameState.Mining) {
			[width, height] = this.hint.getLayout() ?? [0, 0];
			this.hint.render(canvas,
				canvas.width - width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3),
				canvas.height - height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));
		}

		[width, height] = this.score.getLayout() ?? [0, 0];
		this.score.render(canvas, 5, canvas.height - height - 2);

		if (this.stats.state === GameState.Mining && (this.stats.explosives !== NOT_DISCOVERED || this.stats.discoveredAssays)) {
			[width, height] = this.abilities.getLayout() ?? [0, 0];
			this.abilities.render(canvas, canvas.width - width + 1, canvas.height - height - 2);
		}
	}

	public onMouseDown () {
		if (this.stats.state === GameState.FellBehind)
			this.stats.reset();
	}
}

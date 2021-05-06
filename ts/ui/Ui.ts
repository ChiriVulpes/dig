import Events, { EventBus } from "Events";
import AbilitiesElement from "ui/hud/Abilities";
import ScoreElement from "ui/hud/Score";
import { GameState } from "../Constants";
import { Stats } from "../game/Stats";
import Canvas from "./Canvas";

@Events.Bus(EventBus.Ui)
export class Ui {

	private score = new ScoreElement(this.stats);
	private abilities = new AbilitiesElement(this.stats);

	// private abilities = new MutableText(() => [
	// 	"ABILITIES: Right Click",
	// 	...!this.stats.discoveredAssays ? []
	// 		: [`Assay cost: $${this.stats.assayCost}`],
	// 	...this.stats.explosives === NOT_DISCOVERED ? []
	// 		: [`Explosives: Have ${this.stats.explosives}`],
	// ].join("\n"))
	// 	.setAlign(Align.Right);

	// private title = new MutableText(() =>
	// 	this.stats.state === GameState.Surface ? "DIG DIG DIG"
	// 		: "GAME OVER!")
	// 	.setScale(4);
	// private author = new MutableText(() => "by Chirichirichiri")
	// 	.setScale(2);
	// private hint = new MutableText(() =>
	// 	this.stats.state === GameState.Surface ? "Use the mouse to start mining!"
	// 		: "Click anywhere to play again!");

	public constructor (private readonly stats: Stats) {
	}

	public render (canvas: Canvas) {
		let width: number;
		let height: number;

		// if (this.stats.state !== GameState.Mining) {
		// 	[width, height] = this.title.getLayout() ?? [0, 0];
		// 	this.title.render(canvas,
		// 		canvas.width / 2 - width / 2,
		// 		canvas.height / 4 - height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));
		// }

		// if (this.stats.state === GameState.Surface) {
		// 	const titleXEnd = canvas.width / 2 + width! / 2;
		// 	const titleYEnd = canvas.height / 4 + height! / 2;
		// 	[width, height] = this.author.getLayout() ?? [0, 0];
		// 	this.author.render(canvas,
		// 		titleXEnd - width,
		// 		titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));

		// }

		// if (this.stats.state !== GameState.Mining) {
		// 	[width, height] = this.hint.getLayout() ?? [0, 0];
		// 	this.hint.render(canvas,
		// 		canvas.width - width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3),
		// 		canvas.height - height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));
		// }

		this.score.draw(canvas, 5, canvas.height - this.score.height - 2);

		// if (this.stats.state === GameState.Mining && (this.stats.explosives !== NOT_DISCOVERED || this.stats.discoveredAssays)) {
		this.abilities.draw(canvas, canvas.width - this.abilities.width - 5, canvas.height - this.abilities.height - 2);
		// }
	}

	@Events.Handler(EventBus.Mouse, "down")
	public onMouseDown () {
		if (this.stats.state === GameState.FellBehind)
			this.stats.reset();
	}
}

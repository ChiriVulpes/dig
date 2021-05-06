import Events, { EventBus } from "Events";
import EphemeralElement from "ui/element/EphemeralElement";
import AbilitiesElement from "ui/hud/Abilities";
import ScoreElement from "ui/hud/Score";
import Watch from "util/Watch";
import { GameState } from "../Constants";
import { Stats } from "../game/Stats";
import Canvas from "./Canvas";

@Events.Bus(EventBus.Ui)
export class Ui {

	private score = new ScoreElement(this.stats);
	private abilities = new AbilitiesElement(this.stats);

	private title = new EphemeralElement(() => this.stats.state !== GameState.Mining)
		.add(() => this.stats.state === GameState.Surface ? "DIG DIG DIG" : "GAME OVER!")
		.setStyle("scale", 4)
		.setRefreshOn(EventBus.Main, "update", Watch(() => this.stats.state === GameState.Surface));
	private author = new EphemeralElement(() => this.stats.state === GameState.Surface)
		.add("by Chirichirichiri")
		.setStyle("scale", 2);
	private hint = new EphemeralElement(() => this.stats.state !== GameState.Mining)
		.add(() => this.stats.state === GameState.Surface ? "Use the mouse to start mining!" : "Click anywhere to play again!")
		.setRefreshOn(EventBus.Main, "update", Watch(() => this.stats.state === GameState.Surface));

	public constructor (private readonly stats: Stats) {
	}

	public render (canvas: Canvas) {
		this.title.draw(canvas,
			canvas.width / 2 - this.title.width / 2,
			canvas.height / 4 - this.title.height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));

		const titleXEnd = canvas.width / 2 + this.title.width / 2;
		const titleYEnd = canvas.height / 4 + this.title.height / 2;
		this.author.draw(canvas,
			titleXEnd - this.author.width,
			titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));

		this.hint.draw(canvas,
			canvas.width - this.hint.width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3),
			canvas.height - this.hint.height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));

		this.score.draw(canvas, 5, canvas.height - this.score.height - 2);

		this.abilities.draw(canvas, canvas.width - this.abilities.width - 5, canvas.height - this.abilities.height - 2);
	}

	@Events.Handler(EventBus.Mouse, "down")
	public onMouseDown () {
		if (this.stats.state === GameState.FellBehind)
			this.stats.reset();
	}
}

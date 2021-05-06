import { CANVAS, GameState } from "Constants";
import { EventBus } from "Events";
import { Stats } from "game/Stats";
import AbsoluteContainerElement from "ui/element/AbsoluteContainerElement";
import EphemeralElement from "ui/element/EphemeralElement";
import AbilitiesElement from "ui/hud/Abilities";
import ScoreElement from "ui/hud/Score";
import { Margin } from "util/Geometry";
import Watch from "util/Watch";

export default class Hud extends AbsoluteContainerElement {

	public score = new ScoreElement(this.stats)
		.setStyle("margin", new Margin().setBottom(0))
		.appendTo(this);

	public abilities = new AbilitiesElement(this.stats)
		.setStyle("margin", new Margin().setBottom(0).setRight(0))
		.appendTo(this);

	public title = new EphemeralElement(() => this.stats.state !== GameState.Mining)
		.append(() => this.stats.state === GameState.Surface ? "DIG DIG DIG" : "GAME OVER!")
		.setStyle("scale", 4)
		.setStyle("margin", (self, container) => new Margin()
			.setLeft(container.renderWidth / 2 - self.renderWidth / 2)
			.setTop(container.renderHeight / 4 - self.renderHeight / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10)))
		.setRefreshOn(EventBus.Main, "update", Watch(() => this.stats.state === GameState.Surface))
		.appendTo(this);

	public author = new EphemeralElement(() => this.stats.state === GameState.Surface)
		.append("by Chirichirichiri")
		.setStyle("scale", 2)
		.setStyle("margin", (self, container) => new Margin()
			.setLeft(container.renderWidth / 2 + this.title.renderWidth / 2 - self.renderWidth)
			.setTop(container.renderHeight / 4 + this.title.renderHeight / 2 + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10)))
		.setRefreshOn(EventBus.Main, "update", Watch(() => this.stats.state === GameState.Surface))
		.appendTo(this);

	public hint = new EphemeralElement(() => this.stats.state !== GameState.Mining)
		.append(() => this.stats.state === GameState.Surface ? "Use the mouse to start mining!" : "Click anywhere to play again!")
		.setStyle("margin", (self, container) => new Margin()
			.setLeft(container.renderWidth - self.renderWidth - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3))
			.setTop(container.renderHeight - self.renderHeight - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5)))
		.setRefreshOn(EventBus.Main, "update", Watch(() => this.stats.state === GameState.Surface))
		.appendTo(this);

	public constructor (private readonly stats: Stats) {
		super();
		this.setStyle("padding", Margin.of(5).setBottom(2))
			.setStyle("maxWidth", CANVAS)
			.setStyle("maxHeight", CANVAS);

		this.setRenderOn(EventBus.Main, "update");
	}
}

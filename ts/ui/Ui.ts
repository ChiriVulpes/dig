import Events, { EventBus } from "Events";
import Hud from "ui/hud/Hud";
import { GameState } from "../Constants";
import { Stats } from "../game/Stats";
import Canvas from "./Canvas";

@Events.Subscribe
@Events.Bus(EventBus.Ui)
export class Ui {

	public readonly hud = new Hud(this.stats);

	public constructor (private readonly stats: Stats) {
	}

	public render (canvas: Canvas) {
		this.hud.draw(canvas, 0, 0);
	}

	@Events.Handler(EventBus.Mouse, "down")
	public onMouseDown () {
		if (this.stats.state === GameState.FellBehind)
			this.stats.reset();
	}
}

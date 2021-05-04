import Events, { EventBus } from "Events";
import { Stats } from "game/Stats";
import { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import Text from "ui/element/Text";

@Events.Subscribe
export default class ScoreElement extends FlowContainerElement {
	public constructor (stats: Stats) {
		super();
		this.add(new Text(() => `Depth: ${stats.turn}${!stats.scheduledDepthDifference ? ""
			: ` (${stats.scheduledDepthDifference > 0 ? "+" : ""}${stats.scheduledDepthDifference})`}`));
		this.add(SYMBOL_NEWLINE);
		this.add(() => stats.turn * 10 === stats.score ? undefined
			: new Text(`Stock value: $${stats.score}`));
	}

	@Events.Handler(EventBus.Main, "update")
	protected onUpdate () {
		this.markNeedsRefresh();
	}
}

import Events, { EventBus } from "Events";
import { Stats } from "game/Stats";
import { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import LabelledValue from "ui/element/LabelledValue";
import Text from "ui/element/Text";

@Events.Subscribe
export default class ScoreElement extends FlowContainerElement {
	public constructor (stats: Stats) {
		super();
		this
			.add(new LabelledValue()
				.setLabel("Depth")
				.add(new Text(() => `${stats.turn}${!stats.scheduledDepthDifference ? ""
					: ` (${stats.scheduledDepthDifference > 0 ? "+" : ""}${stats.scheduledDepthDifference})`}`)
					.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("turn", stats.turn) || this.valueChanged("depthDiff", stats.scheduledDepthDifference))))
			.add(SYMBOL_NEWLINE)
			.add(new FlowContainerElement()
				.add(() => stats.turn * 10 === stats.score ? undefined
					: new LabelledValue()
						.setLabel("Stock value")
						.add(`$${stats.score}`))
				.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("score", stats.score)));
	}
}

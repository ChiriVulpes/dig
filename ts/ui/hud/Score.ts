import { EventBus } from "Events";
import { Stats } from "game/Stats";
import { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import EphemeralElement from "ui/element/EphemeralElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import LabelledValue from "ui/element/LabelledValue";
import Scheme from "ui/element/Scheme";
import Text from "ui/element/Text";

export default class ScoreElement extends FlowContainerElement {
	public constructor (stats: Stats) {
		super();
		this
			.add(new LabelledValue()
				.setLabel("Depth")
				.add(new Text(() => `${stats.turn}`)
					.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("turn", stats.turn)))
				.add(new EphemeralElement(() => stats.scheduledDepthDifference)
					.add(new Text(" (").setStyle("colour", Scheme.COLOUR_FOREGROUND_TERTIARY))
					.add(new Text(() => `${stats.scheduledDepthDifference > 0 ? "+" : ""}${stats.scheduledDepthDifference}`)
						.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("depthDiff", stats.scheduledDepthDifference)))
					.add(new Text(")").setStyle("colour", Scheme.COLOUR_FOREGROUND_TERTIARY))))
			.add(SYMBOL_NEWLINE)
			.add(new EphemeralElement(() => stats.turn * 10 !== stats.score)
				.add(new LabelledValue()
					.setLabel("Stock value")
					.add(new Text(() => `$${stats.score}`)
						.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("score", stats.score)))));
	}
}

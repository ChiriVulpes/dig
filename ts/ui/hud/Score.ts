import { GameState } from "Constants";
import { EventBus } from "Events";
import { Stats } from "game/Stats";
import { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import EphemeralElement from "ui/element/EphemeralElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import LabelledValue from "ui/element/LabelledValue";
import Scheme from "ui/element/Scheme";
import Text from "ui/element/Text";
import Watch from "util/Watch";

export default class ScoreElement extends FlowContainerElement {
	public constructor (stats: Stats) {
		super();
		this
			.append(new EphemeralElement(() => stats.state === GameState.Surface)
				.append(new LabelledValue()
					.setLabel("Highest stock value")
					.append(new Text(() => `$${stats.highscore}`)
						.setRefreshOn(EventBus.Main, "update", Watch(() => stats.highscore)))))
			.append(new EphemeralElement(() => stats.state !== GameState.Surface)
				.append(new LabelledValue()
					.setLabel("Depth")
					.append(new Text(() => `${stats.turn}`)
						.setRefreshOn(EventBus.Main, "update", Watch(() => stats.turn)))
					.append(new EphemeralElement(() => stats.scheduledDepthDifference)
						.append(new Text(" (").setStyle("colour", Scheme.COLOUR_FOREGROUND_TERTIARY))
						.append(new Text(() => `${stats.scheduledDepthDifference > 0 ? "+" : ""}${stats.scheduledDepthDifference}`)
							.setRefreshOn(EventBus.Main, "update", Watch(() => stats.scheduledDepthDifference)))
						.append(new Text(")").setStyle("colour", Scheme.COLOUR_FOREGROUND_TERTIARY))))
				.append(SYMBOL_NEWLINE)
				.append(new EphemeralElement(() => stats.turn * 10 !== stats.score)
					.append(new LabelledValue()
						.setLabel("Stock value")
						.append(new Text(() => `$${stats.score}`)
							.setRefreshOn(EventBus.Main, "update", Watch(() => stats.score))))));
	}
}

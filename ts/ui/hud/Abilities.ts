import { GameState } from "Constants";
import { EventBus } from "Events";
import { NOT_DISCOVERED, Stats } from "game/Stats";
import { SYMBOL_NEWLINE } from "ui/element/ContainerElement";
import EphemeralElement from "ui/element/EphemeralElement";
import LabelledValue from "ui/element/LabelledValue";
import Scheme from "ui/element/Scheme";
import { Align } from "ui/element/Style";
import Text from "ui/element/Text";
import Watch from "util/Watch";

export default class AbilitiesElement extends EphemeralElement {
	public constructor (stats: Stats) {
		super(() => stats.state === GameState.Mining
			&& (stats.explosives !== NOT_DISCOVERED || stats.discoveredAssays));

		this
			.setStyle("align", Align.Right)
			.append(new LabelledValue()
				.setLabel("ABILITIES")
				.append(new Text("Right Click").setStyle("colour", Scheme.COLOUR_INPUT)))
			.append(SYMBOL_NEWLINE)
			.append(new EphemeralElement(() => stats.discoveredAssays)
				.append(new LabelledValue()
					.setLabel("Assay Cost")
					.append(new Text(() => `$${stats.assayCost}`)
						.setRefreshOn(EventBus.Main, "update", Watch(() => stats.assayCost)))))
			.append(SYMBOL_NEWLINE)
			.append(new EphemeralElement(() => stats.explosives !== NOT_DISCOVERED)
				.append(new LabelledValue()
					.setLabel("Explosives")
					.append(new Text("Have ").setStyle("colour", Scheme.COLOUR_FOREGROUND_TERTIARY))
					.append(new Text(() => `${stats.explosives}`)
						.setRefreshOn(EventBus.Main, "update", Watch(() => stats.explosives)))));
	}
}

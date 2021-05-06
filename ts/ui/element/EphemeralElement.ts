import { EventBus } from "Events";
import FlowContainerElement from "ui/element/FlowContainerElement";

export default class EphemeralElement extends FlowContainerElement {
	public constructor (private readonly predicate: () => any) {
		super();
		this.setRefreshOn(EventBus.Main, "update", () => this.valueChanged("ephemeralPredicate", predicate()));
	}

	protected override reflow () {
		if (!this.predicate())
			return { lines: [], width: 0, height: 0 };

		return super.reflow();
	}
}

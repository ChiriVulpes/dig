import { EventBus } from "Events";
import Canvas from "ui/Canvas";
import FlowContainerElement, { IFlowLayoutInformation } from "ui/element/FlowContainerElement";
import Watch from "util/Watch";

export default class EphemeralElement extends FlowContainerElement {
	public constructor (private readonly predicate: () => any) {
		super();
		this.setRefreshOn(EventBus.Main, "update", Watch(predicate));
	}

	protected override reflow () {
		if (!this.predicate())
			return { lines: [], width: 0, height: 0 };

		return super.reflow();
	}

	protected override async render (canvas: Canvas, info: IFlowLayoutInformation) {
		if (info.width === 0 || info.height === 0)
			return;

		return super.render(canvas, info);
	}
}

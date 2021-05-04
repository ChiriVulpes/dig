import { ResolveableChild } from "ui/element/ContainerElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import Text from "ui/element/Text";
import Bound from "util/decorator/Bound";

export default class LabelledValue extends FlowContainerElement {

	private readonly contents = new FlowContainerElement();

	public constructor () {
		super();
		this.add(this.getLabel);
		this.add(this.contents);
		this.setDeferredContainer(this.contents);
	}

	private label?: ResolveableChild;
	public setLabel (label?: ResolveableChild) {
		this.label = new FlowContainerElement()
			.add(label)
			.add(new Text(": "));
		return this;
	}

	@Bound private getLabel () {
		return typeof this.label === "function" ? this.label() : this.label;
	}
}

import { ResolveableChild } from "ui/element/ContainerElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import { Color } from "util/Color";

export default class LabelledValue extends FlowContainerElement {

	private readonly label = new FlowContainerElement()
		.setStyle("color", Color.fromInt(0xCCCCCC));
	private readonly contents = new FlowContainerElement();

	public constructor () {
		super();
		this.add(this.label, this.contents);
		this.setDeferredContainer(this.contents);
	}

	public initialiseLabel (initialiser: (container: FlowContainerElement) => any) {
		this.label.empty();
		initialiser(this.label);
		this.label.add(": ");
		return this;
	}

	public setLabel (...contents: ResolveableChild[]) {
		this.label.empty()
			.add(...contents, ": ");
		return this;
	}
}

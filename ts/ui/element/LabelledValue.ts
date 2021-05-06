import { ResolveableChild } from "ui/element/ContainerElement";
import FlowContainerElement from "ui/element/FlowContainerElement";
import Colour from "util/Colour";

export default class LabelledValue extends FlowContainerElement {

	private readonly label = new FlowContainerElement()
		.setStyle("colour", Colour.fromInt(0xCCCCCC));
	private readonly contents = new FlowContainerElement();

	public constructor () {
		super();
		this.append(this.label, this.contents);
		this.setDeferredContainer(this.contents);
	}

	public initialiseLabel (initialiser: (container: FlowContainerElement) => any) {
		this.label.empty();
		initialiser(this.label);
		this.label.append(": ");
		return this;
	}

	public setLabel (...contents: ResolveableChild[]) {
		this.label.empty()
			.append(...contents, ": ");
		return this;
	}
}

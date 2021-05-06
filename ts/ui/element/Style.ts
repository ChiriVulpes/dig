import { EventHost } from "@@wayward/excevent/Emitter";
import Events from "Events";
import Element from "ui/element/Element";
import Scheme from "ui/element/Scheme";
import Colour from "util/Color";
import { IMargin, Margin } from "util/Geometry";

export enum Align {
	Left,
	Centre,
	Right,
}

// no perfect types, stack overflow :(
// export type StyleProperty = { [PROPERTY in keyof IStyle]-?: { name: PROPERTY, value: IStyle[PROPERTY] } }[keyof IStyle];
export type StyleProperty = { name: keyof IStyle; value: IStyle[keyof IStyle] };

export interface IStyleEvents {
	change (property: StyleProperty): any;
}

export interface IStyle {
	scale: number;
	colour: Colour;
	shadow: Colour;
	align: Align;
	maxWidth: number;
	maxHeight: number;
	margin: IMargin | ((self: Element, container: Element) => IMargin);
	padding: IMargin;
}

export const INHERITED_STYLES: { [PROPERTY in keyof IStyle]-?: boolean } = {
	scale: true,
	colour: true,
	shadow: true,
	align: true,
	maxWidth: false,
	maxHeight: false,
	margin: false,
	padding: false,
};

const DEFAULT_STYLES: IStyle = {
	align: Align.Left,
	scale: 1,
	colour: Scheme.COLOUR_FOREGROUND_PRIMARY,
	shadow: Scheme.COLOUR_SHADOW,
	maxWidth: Infinity,
	maxHeight: Infinity,
	margin: Margin.ZERO,
	padding: Margin.ZERO,
};

export default class Style extends EventHost(Events)<IStyleEvents> {

	public static equals<P extends keyof IStyle> (property: P, value1: IStyle[P], value2: IStyle[P]) {
		switch (property) {
			case "color": return Colour.equals(value1 as Colour, value2 as Colour);
			default: return value1 === value2;
		}
	}

	public static readonly DEFAULT = DEFAULT_STYLES;

	public get<P extends keyof IStyle> (property: P) {
		return (this as Partial<IStyle>)[property] as IStyle[P] | undefined;
	}

	public set<P extends keyof IStyle> (property: P, value?: IStyle[P]) {
		const style = this as Partial<IStyle>;
		const current = style[property] as IStyle[P] | undefined;
		if (value === undefined || current === undefined || !Style.equals(property, value, current)) {
			style[property] = value;
			this.event.emit("change", { name: property, value } as StyleProperty);
		}
		return this;
	}

	public remove (property: keyof IStyle) {
		return this.set(property);
	}
}



import { EventHost } from "@@wayward/excevent/Emitter";
import Events from "Events";
import { Color } from "util/Color";

export type StyleProperty = { [PROPERTY in keyof IStyle]-?: { name: PROPERTY, value: IStyle[PROPERTY] } }[keyof IStyle];

export interface IStyleEvents {
	change (property: StyleProperty): any;
}

export interface IStyle {
	scale: number;
	color: Color;
	shadow: Color;
}

export default class Style extends EventHost(Events)<IStyleEvents> {

	public static equals<P extends keyof IStyle> (property: P, value1: IStyle[P], value2: IStyle[P]) {
		switch (property) {
			case "color": return Color.equals(value1 as Color, value2 as Color);
			default: return value1 === value2;
		}
	}

	public static readonly DEFAULT: IStyle = {
		scale: 1,
		color: Color.WHITE,
		shadow: Color.BLACK,
	};

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



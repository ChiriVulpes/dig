import { IEventApi } from "@@wayward/excevent/IExcevent";
import Events, { EventBus } from "Events";
import { ITarget, Mouse } from "ui/Mouse";

export enum Cursor {
	// Dig,
	Default,
	Pointer,
	Grab,
	Grabbing,
}

export interface IHasCustomCursor {
	cursor?: Cursor;
}

@Events.Subscribe
export default class CursorHandler {

	private cursor?: Cursor;

	@Events.Handler(EventBus.Mouse, "changeTarget")
	protected onChangeTarget (api: IEventApi<Mouse>, target?: ITarget) {
		const cursor = (target as IHasCustomCursor | undefined)?.cursor;
		if (this.cursor === cursor)
			return;

		if (this.cursor !== undefined)
			document.body.classList.remove(`cursor-${Cursor[this.cursor!].toLowerCase()}`);

		this.cursor = cursor;
		if (cursor !== undefined)
			document.body.classList.add(`cursor-${Cursor[cursor!].toLowerCase()}`)
	}
}

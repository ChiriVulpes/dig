import Excevent from "@@wayward/excevent/Excevent";
import { Main } from "dig";
import { Stats } from "game/Stats";
import Tile from "game/Tile";
import World from "game/World";
import { Mouse } from "ui/Mouse";
import { Ui } from "ui/Ui";
import { View } from "ui/View";

export enum EventBus {
	Main,
	Mouse,
	Stats,
	Tile,
	Ui,
	View,
	World,
}

export interface IEventBuses {
	[EventBus.Main]: typeof Main;
	[EventBus.Mouse]: typeof Mouse;
	[EventBus.Stats]: typeof Stats;
	[EventBus.Tile]: typeof Tile;
	[EventBus.Ui]: typeof Ui;
	[EventBus.View]: typeof View;
	[EventBus.World]: typeof World;
}

export default new Excevent<IEventBuses>();

export { Events as EventsOf } from "@@wayward/excevent/IExcevent";


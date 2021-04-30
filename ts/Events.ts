import Excevent from "@@wayward/excevent/amd/Excevent";
import { Stats } from "game/Stats";
import Tile from "game/Tile";
import World from "game/World";
import { Mouse } from "ui/Mouse";
import { Ui } from "ui/Ui";
import { View } from "ui/View";

export enum EventBus {
	Mouse,
	Stats,
	Tile,
	Ui,
	View,
	World,
}

export interface IEventBuses {
	[EventBus.Mouse]: typeof Mouse;
	[EventBus.Stats]: typeof Stats;
	[EventBus.Tile]: typeof Tile;
	[EventBus.Ui]: typeof Ui;
	[EventBus.View]: typeof View;
	[EventBus.World]: typeof World;
}

export default new Excevent<IEventBuses>();

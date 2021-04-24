import Canvas from "../ui/Canvas";
import { IHasMouseEventHandlers } from "../ui/Mouse";
import Sprite from "../ui/Sprite";
import Random from "../util/Random";
import Sound, { SoundType } from "../util/Sound";
import World from "./World";

export enum TileType {
	Rock,
	Metal,
}

interface ITileDescription {
	hitSound: SoundType;
	invulnerable?: true;
}

const tiles: Record<TileType, ITileDescription> = {
	[TileType.Metal]: {
		hitSound: SoundType.Metal,
		invulnerable: true,
	},
	[TileType.Rock]: {
		hitSound: SoundType.Hit,
	}
};

export default class Tile implements IHasMouseEventHandlers {

	private hovering = false;
	private context?: {
		world: World;
		x: number;
		y: number;
	};

	private durability = Random.int(2, 4);
	private breakAnim = 0;

	public constructor (public readonly type: TileType) {
	}

	public setContext (world: World, x: number, y: number) {
		this.context = { world, x, y };
		return this;
	}

	public getSprite () {
		return Sprite.get(`tile/${TileType[this.type].toLowerCase()}`);
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.getSprite().render(canvas, x, y);
		if (this.hovering)
			Sprite.get("ui/hover").render(canvas, x, y);

		if (this.breakAnim)
			Sprite.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);
	}

	public onMouseEnter () {
		this.hovering = true;
	}

	public onMouseLeave () {
		this.hovering = false;
	}

	public onMouseClick () {
		if (!tiles[this.type].invulnerable) {
			if (--this.durability < 0) {
				this.context?.world.removeTile(this.context.x, this.context.y);
				Sound.get(SoundType.Break).play();
				return;
			}

			this.breakAnim++;
		}

		Sound.get(tiles[this.type].hitSound).play();
	}

	public onMouseDown () {

	}

	public onMouseUp () {

	}
}

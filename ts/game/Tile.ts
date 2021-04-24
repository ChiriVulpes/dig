import { TILE } from "../Constants";
import Canvas from "../ui/Canvas";
import { IHasMouseEventHandlers } from "../ui/Mouse";
import Sprite from "../ui/Sprite";
import Direction, { Directions } from "../util/Direction";
import Enums from "../util/Enums";
import Random from "../util/Random";
import Sound, { SoundType } from "../util/Sound";
import World from "./World";

export enum TileType {
	Rock,
	Metal,
	Grass,
}

interface ITileDescription {
	hitSound?: SoundType;
	invulnerable?: true;
	nonselectable?: true;
	mask?: string;
}

const tiles: Record<TileType, ITileDescription> = {
	[TileType.Metal]: {
		hitSound: SoundType.Metal,
		invulnerable: true,
	},
	[TileType.Rock]: {
		hitSound: SoundType.Hit,
		mask: "rock",
	},
	[TileType.Grass]: {
		nonselectable: true,
		mask: "rock",
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

	private mask?: Direction;

	public constructor (public readonly type: TileType) {
	}

	public setContext (world: World, x: number, y: number) {
		this.context = { world, x, y };
		return this;
	}

	public getSprite () {
		return Sprite.get(`tile/${TileType[this.type].toLowerCase()}`);
	}

	public invalidateMask () {
		delete this.mask;
	}

	public getMask () {
		if (this.mask === undefined)
			this.updateMask();

		return this.mask;
	}

	private updateMask () {
		this.mask = Direction.None;
		if (!this.context || !tiles[this.type].mask)
			return;

		for (const direction of Enums.values(Direction))
			if (!this.context.world.getTile(...Directions.move(this.context.x, this.context.y, direction)))
				this.mask |= direction;
	}

	public render (canvas: Canvas, x: number, y: number) {
		this.getSprite().render(canvas, x, y);

		const mask = this.getMask();
		if (mask !== undefined) {
			const maskSprite = Sprite.get(`tile/mask/${tiles[this.type].mask}`);
			canvas.context.globalCompositeOperation = "destination-out";

			if (mask & Direction.North)
				maskSprite.render(canvas, x, y, 0, 0, TILE, TILE);
			if (mask & Direction.East)
				maskSprite.render(canvas, x, y, TILE, 0, TILE, TILE);
			if (mask & Direction.South)
				maskSprite.render(canvas, x, y, TILE, TILE, TILE, TILE);
			if (mask & Direction.West)
				maskSprite.render(canvas, x, y, 0, TILE, TILE, TILE);

			canvas.context.globalCompositeOperation = "source-over";
		}

		if (this.breakAnim)
			Sprite.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);

		if (this.hovering)
			Sprite.get("ui/hover").render(canvas, x, y);
	}

	public onMouseEnter () {
		this.hovering = true;
	}

	public onMouseLeave () {
		this.hovering = false;
	}

	public onMouseClick () {
		if (!tiles[this.type].invulnerable) {
			if (--this.durability < 0 && this.context) {
				this.context.world.removeTile(this.context.x, this.context.y);
				Sound.get(SoundType.Break).play();
				this.context.world.stats.dug++;
				return;
			}

			this.breakAnim++;
		}

		Sound.get(tiles[this.type].hitSound)?.play();
	}

	public onMouseDown () {

	}

	public onMouseUp () {

	}
}

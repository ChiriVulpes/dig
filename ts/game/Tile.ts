import { TILE } from "../Constants";
import Canvas from "../ui/Canvas";
import { IHasMouseEventHandlers } from "../ui/Mouse";
import Sprite from "../ui/Sprite";
import Direction, { Directions } from "../util/Direction";
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

const LIGHT_MAX = 3;

export interface ITileContext {
	world: World;
	x: number;
	y: number;
}

export default class Tile implements IHasMouseEventHandlers {

	private hovering = false;
	private context?: ITileContext;

	private durability = Random.int(2, 4);
	private breakAnim = 0;

	private mask?: Direction;
	private light?: number;
	private recalcLightTick: number | undefined = -1;

	public constructor (public readonly type: TileType) {
	}

	public setContext (world: World, x: number, y: number) {
		this.context = { world, x, y };
		return this;
	}

	public getSprite () {
		return Sprite.get(`tile/${TileType[this.type].toLowerCase()}`);
	}

	public invalidate (tick: number) {
		delete this.mask;
		this.recalcLightTick = tick;
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

		for (const direction of Directions.CARDINALS)
			if (!this.context.world.getTileInDirection(direction, this.context))
				this.mask |= direction;
	}

	public getLight (tick: number) {
		if (this.recalcLightTick !== undefined && this.recalcLightTick < tick)
			this.updateLight(tick);

		return this.light ?? 0;
	}

	private updateLight (tick: number) {
		if (!this.context)
			return;

		const tiles = Directions.CARDINALS
			.map(direction => this.context!.world.getTileInDirection(direction, this.context!));

		const maxLightLevel = Math.max(...tiles.map(tile => tile === undefined ? LIGHT_MAX + 1 : tile?.light ?? 0));
		this.light = maxLightLevel - 1;
		for (const tile of tiles)
			if (tile && (tile.light ?? 0) < this.light - 1)
				tile.invalidate(tick);

		delete this.recalcLightTick;
	}

	public render (canvas: Canvas, x: number, y: number) {
		const light = this.getLight(this.context?.world.stats.tick ?? 0);
		if (light < LIGHT_MAX)
			canvas.context.filter = `brightness(${Math.floor(light / LIGHT_MAX * 100)}%)`;

		this.getSprite().render(canvas, x, y);

		canvas.context.filter = "none";

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
		if (this.light === LIGHT_MAX)
			this.hovering = true;
	}

	public onMouseLeave () {
		this.hovering = false;
	}

	public onMouseClick () {
	}

	public onMouseHold () {
		if (!this.hovering || !this.context)
			return;

		if (this.context.world.stats.tick % 10)
			return;

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

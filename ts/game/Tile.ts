import { SURFACE_TILES, TILE } from "../Constants";
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
	Emerald,
	Cavern,
	Mineshaft,
}

export enum TileCategory {
	Ore,
}

const LIGHT_MAX = 3;

interface ITileDescription {
	hitSound?: SoundType;
	breakSound?: SoundType;
	invulnerable?: true;
	nonselectable?: true;
	mask?: string;
	base?: TileType;
	category?: TileCategory;
	invisible?: true;
	background?: TileType;
	light?: number;
	score?: number;
	update?(tile: Tile): any;
}

const tiles: Record<TileType, ITileDescription> = {
	[TileType.Metal]: {
		hitSound: SoundType.Metal,
		invulnerable: true,
	},
	[TileType.Rock]: {
		hitSound: SoundType.Hit,
		mask: "rock",
		background: TileType.Rock,
	},
	[TileType.Grass]: {
		mask: "rock",
	},
	[TileType.Emerald]: {
		base: TileType.Rock,
		category: TileCategory.Ore,
		hitSound: SoundType.Gem,
		breakSound: SoundType.BreakGem,
		score: 100,
	},
	[TileType.Mineshaft]: {
		invisible: true,
		nonselectable: true,
		background: TileType.Rock,
		light: LIGHT_MAX + 1,
	},
	[TileType.Cavern]: {
		invisible: true,
		nonselectable: true,
		update (tile: Tile) {
			if (tile.getLight() === LIGHT_MAX)
				tile.remove(true);
		},
	}
};

function getProperty<P extends keyof ITileDescription> (type: TileType, property: P): ITileDescription[P] {
	let description = tiles[type];
	if (description[property] === undefined && description.base !== undefined)
		return getProperty(description.base, property);

	return description[property];
}

export interface ITileContext {
	world: World;
	x: number;
	y: number;
}

export default class Tile implements IHasMouseEventHandlers {

	private hovering = false;
	public context: ITileContext;

	private durability = Random.int(2, 4);
	private breakAnim = 0;

	private mask?: Direction;
	private light?: number;
	private recalcLightTick: number | undefined = -1;

	public constructor (public readonly type: TileType, world: World, x: number, y: number) {
		this.context = { world, x, y };
	}

	public get description () {
		return tiles[this.type];
	}

	public remove (accessible: boolean) {
		this.context.world.removeTile(this.context.x, this.context.y, accessible);
		return this;
	}

	public invalidate () {
		delete this.mask;
		this.recalcLightTick = this.context.world.stats.tick;
	}

	public getMask () {
		if (this.mask === undefined)
			this.updateMask();

		return this.mask;
	}

	private updateMask () {
		this.mask = Direction.None;
		if (!getProperty(this.type, "mask"))
			return;

		for (const direction of Directions.CARDINALS) {
			const tile = this.context.world.getTileInDirection(direction, this.context);
			if (!tile || tile.description.invisible)
				this.mask |= direction;
		}
	}

	public getLight () {
		let producedLight = getProperty(this.type, "light");
		if (producedLight)
			return producedLight;

		if (this.recalcLightTick !== undefined && this.recalcLightTick < this.context.world.stats.tick)
			this.updateLight();

		return this.light ?? 0;
	}

	private updateLight () {
		const tiles = Directions.CARDINALS
			.map(direction => this.context.world.getTileInDirection(direction, this.context));

		const maxLightLevel = Math.max(...tiles.map(tile => tile ? getProperty(tile?.type, "light") ?? tile?.light ?? 0 : 0));
		this.light = maxLightLevel - 1;
		for (const tile of tiles)
			if (tile && (tile.light ?? 0) < this.light - 1)
				tile.invalidate();

		delete this.recalcLightTick;
	}

	public static getSprite (type: TileType) {
		const description = tiles[type];
		const category = description.category === undefined ? "" : `/${TileCategory[description.category]}`;
		return Sprite.get(`tile${category}/${TileType[type].toLowerCase()}`);
	}

	public static render (type: TileType, canvas: Canvas, x: number, y: number, light?: number, mask?: Direction, tile?: Tile) {
		const description = tiles[type];

		if (description.invisible && description.background === undefined)
			return;

		if (light !== undefined && light < LIGHT_MAX)
			canvas.context.filter = `brightness(${Math.floor(light / LIGHT_MAX * 100)}%)`;

		if (!description.invisible) {
			if (description.base !== undefined)
				Tile.render(description.base, canvas, x, y, undefined, mask, tile);

			Tile.getSprite(type).render(canvas, x, y);

			if (mask && description.mask) {
				const maskSprite = Sprite.get(`tile/mask/${description.mask}`);
				canvas.context.globalCompositeOperation = "destination-out";

				if (mask & Direction.North)
					maskSprite.render(canvas, x, y, 0, 0, TILE, TILE);
				if (mask & Direction.East)
					maskSprite.render(canvas, x, y, TILE, 0, TILE, TILE);
				if (mask & Direction.South)
					maskSprite.render(canvas, x, y, TILE, TILE, TILE, TILE);
				if (mask & Direction.West)
					maskSprite.render(canvas, x, y, 0, TILE, TILE, TILE);
			}
		}

		canvas.context.globalCompositeOperation = "destination-over";
		if (description.background !== undefined && (tile?.context.y ?? 0) >= SURFACE_TILES)
			Sprite.get(`tile/background/${TileType[description.background].toLowerCase()}`).render(canvas, x, y);

		if (light !== undefined)
			canvas.context.filter = "none";

		canvas.context.globalCompositeOperation = "source-over";
	}

	public render (canvas: Canvas, x: number, y: number) {
		Tile.render(this.type, canvas, x, y, this.getLight(), this.getMask(), this);

		if (this.breakAnim)
			Sprite.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);

		if (this.hovering)
			Sprite.get("ui/hover").render(canvas, x, y);
	}

	public update () {
		tiles[this.type].update?.(this);
	}

	public onMouseEnter () {
		if (this.light === LIGHT_MAX && !tiles[this.type].nonselectable)
			this.hovering = true;
	}

	public onMouseLeave () {
		this.hovering = false;
	}

	public onMouseClick () {
	}

	public onMouseHold () {
		if (!this.hovering)
			return;

		if (this.context.world.stats.exhaustion)
			return;

		this.context.world.stats.exhaustion = 10;

		if (!getProperty(this.type, "invulnerable")) {
			if (--this.durability < 0 && this.context) {
				this.context.world.removeTile(this.context.x, this.context.y, true);
				Sound.get(getProperty(this.type, "breakSound") ?? SoundType.Break).play();
				this.context.world.stats.dug++;
				this.context.world.stats.score += tiles[this.type].score ?? 10;
				return;
			}

			this.breakAnim++;
		}

		Sound.get(getProperty(this.type, "hitSound"))?.play();
	}

	public onMouseDown () {

	}

	public onMouseUp () {

	}
}

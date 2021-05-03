import Events, { EventBus, EventHost, EventsOf, IEventApi } from "Events";
import { Cursor, IHasCustomCursor } from "ui/Cursor";
import { IMouseEvents, ITarget, Mouse } from "ui/Mouse";
import Strings from "util/Strings";
import { GameState, SURFACE_TILES, TILE } from "../Constants";
import Canvas from "../ui/Canvas";
import Sprite from "../ui/Sprite";
import Direction, { Directions } from "../util/Direction";
import Random from "../util/Random";
import Sound, { SoundType } from "../util/Sound";
import World from "./World";

enum DamageType {
	None,
	Mining,
	Explosion,
	Invulnerable = Infinity,
}

export enum TileType {
	Rock,
	Metal,
	Grass,
	Emerald,
	Cavern,
	Mineshaft,
	Explosives,
	Gold,
}

export enum TileCategory {
	Ore,
}

const LIGHT_MAX = 3;

type TileMouseEvent<E extends keyof IMouseEvents> = `onMouse${Capitalize<E>}`;

type TileDescriptionMouseHandler = {
	[E in keyof IMouseEvents as TileMouseEvent<E>]?: (tile: Tile, mouse: Mouse) => false | void;
};

interface ITileDescription extends TileDescriptionMouseHandler {
	cursor?: Cursor;
	hitSound?: SoundType;
	breakSound?: SoundType;
	breakable?: DamageType;
	nonselectable?: true;
	mask?: string;
	base?: TileType;
	category?: TileCategory;
	invisible?: true;
	background?: TileType;
	light?: number;
	score?: number;
	separated?: true;
	update?(tile: Tile): false | void;
	damage?(tile: Tile, damageType: DamageType, amount: number): false | void;
}

const tiles: Record<TileType, ITileDescription> = {
	[TileType.Metal]: {
		hitSound: SoundType.Metal,
		breakable: DamageType.Explosion,
	},
	[TileType.Rock]: {
		hitSound: SoundType.Hit,
		mask: "rock",
		background: TileType.Rock,
		breakable: DamageType.Mining,
	},
	[TileType.Grass]: {
		hitSound: SoundType.Hit,
		mask: "rock",
		breakable: DamageType.Mining,
	},
	[TileType.Emerald]: {
		base: TileType.Rock,
		category: TileCategory.Ore,
		hitSound: SoundType.Gem,
		breakSound: SoundType.BreakGem,
		score: 2500,
	},
	[TileType.Gold]: {
		base: TileType.Rock,
		category: TileCategory.Ore,
		hitSound: SoundType.Gem,
		breakSound: SoundType.BreakGem,
		score: 500,
	},
	[TileType.Mineshaft]: {
		invisible: true,
		nonselectable: true,
		background: TileType.Rock,
		light: LIGHT_MAX + 1,
		onMouseRightClick (tile: Tile) {
			if (tile.context.world.stats.explosives <= 0)
				return;

			tile.context.world.stats.explosives--;
			tile.context.world.setTile(tile.context.x, tile.context.y, TileType.Explosives);
			Sound.get(SoundType.Equip).play();
		},
	},
	[TileType.Cavern]: {
		invisible: true,
		nonselectable: true,
		background: TileType.Rock,
		update (tile: Tile) {
			if (tile.getLight() === LIGHT_MAX)
				tile.remove(true);
		},
	},
	[TileType.Explosives]: {
		background: TileType.Rock,
		separated: true,
		cursor: Cursor["Grab-Ignite"],
		onMouseDown (tile: Tile) {
			if (!tile.isAccessible())
				return;

			tile.context.world.stats.addExplosive();
			tile.remove(true);
			Sound.get(SoundType.Unequip).play();
		},
		onMouseRightClick (tile: Tile) {
			if (!tile.isAccessible())
				return;

			explodeExplosives(tile);
		},
		damage (tile: Tile, damageType: DamageType) {
			if (damageType === DamageType.Explosion)
				explodeExplosives(tile);
		},
	},
};

function explodeExplosives (tile: Tile) {
	tile.remove(true);
	Sound.get(SoundType.Explode).play();

	const range = Random.int(4, Random.int(5, Random.int(6, 9))); // use multiple calls to weight smaller explosions higher
	tile.context.world.particles.create(Sprite.get("explosion"),
		tile.context.x * TILE + TILE / 2,
		tile.context.y * TILE + TILE / 2,
		128, range / 2);

	for (let y = -range + 1; y < range; y++) {
		const absY = Math.abs(y);
		for (let x = -range + 1; x < range; x++) {
			const damage = Math.max(0, range - (Math.abs(x) + absY));
			if (damage)
				tile.context.world.getTile(tile.context.x + x, tile.context.y + y)
					?.damage(DamageType.Explosion, damage * 2, false);
		}
	}
}

function getProperty<P extends keyof ITileDescription> (type: TileType, property: P): ITileDescription[P];
function getProperty<P extends keyof ITileDescription> (type: TileType, property: P, orElse?: Exclude<ITileDescription[P], undefined>): Exclude<ITileDescription[P], undefined>;
function getProperty<P extends keyof ITileDescription> (type: TileType, property: P, orElse?: Exclude<ITileDescription[P], undefined>): ITileDescription[P] {
	let description = tiles[type];
	if (description[property] === undefined && description.base !== undefined)
		return getProperty(description.base, property);

	return description[property] ?? orElse;
}

export interface ITileContext {
	world: World;
	x: number;
	y: number;
}

@Events.Bus(EventBus.Tile)
export default class Tile extends EventHost(Events)<EventsOf<ITarget>> implements ITarget, IHasCustomCursor {

	private hovering = false;
	public context: ITileContext;

	private durability = Random.int(2, 4);
	private breakAnim = 0;

	private mask?: Direction;
	private light?: number;
	private recalcLightTick: number | undefined = -1;
	private revealed?: boolean;

	public get cursor () {
		const result = getProperty(this.type, "cursor");
		if (result !== undefined)
			return result;

		if (this.isMineable())
			return Cursor.Mine;

		return undefined;
	}

	public constructor (public readonly type: TileType, world: World, x: number, y: number) {
		super();
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
			if (!tile || tile.description.invisible || tile.description.separated)
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

		if (this.isMineable())
			this.context.world.setIsMineable(this.context.y);
	}

	public static getSprite (type: TileType) {
		const description = tiles[type];
		const category = description.category === undefined ? "" : `/${TileCategory[description.category].toLowerCase()}`;
		return Sprite.get(`tile${category}/${TileType[type].toLowerCase()}`);
	}

	public static render (tile: Tile, type: TileType, canvas: Canvas, x: number, y: number, light?: number, mask?: Direction) {
		const description = tiles[type];

		if ((light ?? Infinity) <= 0 && (tile.context.world.stats.state === GameState.FellBehind || tile.revealed))
			light = 1;

		if (description.invisible && description.background === undefined || (light !== undefined && light <= 0))
			return;

		if (!description.invisible) {
			if (description.base !== undefined)
				Tile.render(tile, description.base, canvas, x, y, undefined, mask);

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
		if (description.background !== undefined && (tile?.context.y ?? 0) >= SURFACE_TILES && (description.mask ? mask : true))
			Sprite.get(`tile/background/${TileType[description.background].toLowerCase()}`).render(canvas, x, y);

		canvas.context.globalCompositeOperation = "source-over";

		if (light !== undefined && light < LIGHT_MAX) {
			canvas.context.fillStyle = `rgba(0,0,0,${1 - Math.min(1, Math.max(0, light / LIGHT_MAX))})`;
			canvas.context.fillRect(x, y, TILE, TILE);
		}
	}

	public render (canvas: Canvas, x: number, y: number) {
		Tile.render(this, this.type, canvas, x, y, this.getLight(), this.getMask());

		if (this.breakAnim)
			Sprite.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);

		if (this.hovering && this.isAccessible())
			Sprite.get("ui/hover").render(canvas, x, y);
	}

	public update () {
		tiles[this.type].update?.(this);
	}

	public isAccessible () {
		return this.light === LIGHT_MAX && !tiles[this.type].nonselectable;
	}

	public isMineable () {
		return this.isAccessible() && DamageType.Mining >= getProperty(this.type, "breakable", DamageType.Invulnerable);
	}

	public damage (damageType: DamageType, amount = 1, effects = true) {
		if (this.durability < 0)
			return;

		getProperty(this.type, "damage")?.(this, damageType, amount);

		let dealtDamage = false;
		if (damageType >= getProperty(this.type, "breakable", DamageType.Invulnerable)) {
			this.durability -= amount;
			dealtDamage = true;
			if (this.durability < 0) {
				this.break(damageType, effects);
				return;
			}

			if (DamageType.Mining >= getProperty(this.type, "breakable", DamageType.Invulnerable))
				this.breakAnim += amount;
		}

		if (effects) {
			Sound.get(getProperty(this.type, "hitSound"))?.play();
			if (dealtDamage)
				this.particles(2);
		}
	}

	public break (damageType: DamageType, effects = true) {
		this.context.world.removeTile(this.context.x, this.context.y, true);

		this.context.world.stats.score += tiles[this.type].score ?? 0;
		if (damageType === DamageType.Mining)
			this.context.world.stats.dig(this.type);

		if (effects) {
			Sound.get(getProperty(this.type, "breakSound") ?? SoundType.Break).play();
			this.particles(16);
		}
	}

	public particles (amount: number) {
		this.context.world.particles.create(Tile.getSprite(this.type),
			this.context.x * TILE + TILE / 2,
			this.context.y * TILE + TILE / 2,
			amount);
	}

	////////////////////////////////////
	// Mouse events
	//

	@EventHost.Handler(Tile, "mouseMove")
	@EventHost.Handler(Tile, "mouseDown")
	@EventHost.Handler(Tile, "mouseUp")
	@EventHost.Handler(Tile, "mouseClick")
	protected handleEvent (api: IEventApi<Tile>, mouse: Mouse) {
		this.handleMouseEvent(api, mouse);
	}

	@EventHost.Handler(Tile, "mouseEnter")
	protected onMouseEnter (api: IEventApi<Tile>, mouse: Mouse) {
		if (this.handleMouseEvent(api, mouse) === false)
			return;

		this.hovering = true;
	}

	@EventHost.Handler(Tile, "mouseLeave")
	protected onMouseLeave (api: IEventApi<Tile>, mouse: Mouse) {
		if (this.handleMouseEvent(api, mouse) === false)
			return;

		this.hovering = false;
	}

	@EventHost.Handler(Tile, "mouseHold")
	protected onMouseHold (api: IEventApi<Tile>, mouse: Mouse) {
		if (this.handleMouseEvent(api, mouse) === false)
			return;

		if (!this.hovering || !this.isAccessible())
			return;

		if (this.context.world.stats.exhaustion)
			return;

		this.context.world.stats.exhaustion = 10;
		this.damage(DamageType.Mining);
	}

	@EventHost.Handler(Tile, "mouseRightClick")
	protected onMouseRightClick (api: IEventApi<Tile>, mouse: Mouse) {
		if (this.handleMouseEvent(api, mouse) === false)
			return;

		if ((this.getLight() ?? 0) > 0 || this.context.world.stats.score < this.context.world.stats.assayCost)
			return;


		// perform assay
		let revealedAny = false;
		const range = 6;
		for (let y = -range + 1; y < range; y++) {
			const absY = Math.abs(y);
			for (let x = -range + 1; x < range; x++) {
				const value = Math.max(0, range - (Math.abs(x) + absY));
				if (value <= 0)
					continue;

				const tile = this.context.world.getTile(this.context.x + x, this.context.y + y);
				if (tile && !tile.revealed) {
					tile.revealed = true;
					revealedAny = true;
				}
			}
		}

		if (revealedAny) {
			this.context.world.stats.score -= this.context.world.stats.assayCost;
			Sound.get(SoundType.Assay).play();
		}
	}

	private handleMouseEvent (api: IEventApi<Tile>, mouse: Mouse) {
		return tiles[this.type][`on${Strings.capitalise(api.event)}` as const]?.(this, mouse) as false | undefined;
	}
}

define("Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SURFACE_TILES = exports.TILE = exports.TILES = void 0;
    exports.TILES = 18;
    exports.TILE = 16;
    exports.SURFACE_TILES = 20;
});
define("game/Stats", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stats = exports.COST_ASSAY = exports.NOT_DISCOVERED = exports.GameState = void 0;
    var GameState;
    (function (GameState) {
        GameState[GameState["Surface"] = 0] = "Surface";
        GameState[GameState["Mining"] = 1] = "Mining";
        GameState[GameState["FellBehind"] = 2] = "FellBehind";
    })(GameState = exports.GameState || (exports.GameState = {}));
    exports.NOT_DISCOVERED = -1;
    exports.COST_ASSAY = 1000;
    const LOCAL_STORAGE_KEY_SCORES = "scores";
    class Stats {
        constructor() {
            var _a;
            this.scores = JSON.parse((_a = localStorage.getItem(LOCAL_STORAGE_KEY_SCORES)) !== null && _a !== void 0 ? _a : "[]");
            this.reset();
        }
        get difficulty() {
            return this.turn / 1000;
        }
        get highscore() {
            return Math.max(0, ...this.scores);
        }
        get assayCost() {
            return exports.COST_ASSAY + this.turn * 10;
        }
        reset() {
            this.dug = 0;
            this.turn = 0;
            this.tick = 0;
            this.exhaustion = 0;
            this.score = 0;
            this.state = GameState.Surface;
            this.explosives = exports.NOT_DISCOVERED;
            this.discoveredAssays = false;
            return this;
        }
        update() {
            this.tick++;
            if (this.exhaustion)
                this.exhaustion--;
            if (this.score > exports.COST_ASSAY * 5 && !this.discoveredAssays)
                this.discoveredAssays = true;
        }
        passTurn() {
            this.turn++;
            this.state = GameState.Mining;
        }
        dig() {
            this.dug++;
            this.state = GameState.Mining;
        }
        addExplosive() {
            if (this.explosives === exports.NOT_DISCOVERED)
                this.explosives = 0;
            this.explosives++;
        }
        endGame() {
            this.state = GameState.FellBehind;
            this.scores.push(this.score);
            localStorage.setItem(LOCAL_STORAGE_KEY_SCORES, JSON.stringify(this.scores));
        }
    }
    exports.Stats = Stats;
});
define("util/Maths", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Maths;
    (function (Maths) {
        function lerp(from, to, t) {
            return t < 0 ? from
                : t > 1 ? to
                    : (1 - t) * from + t * to;
        }
        Maths.lerp = lerp;
        function unlerp(from, to, lerped) {
            return lerped === from ? 0 : lerped === to ? 1
                : (lerped - from) / (to - from);
        }
        Maths.unlerp = unlerp;
        function direction(direction, distance = 1) {
            return [distance * Math.cos(direction), distance * Math.sin(direction)];
        }
        Maths.direction = direction;
    })(Maths || (Maths = {}));
    exports.default = Maths;
});
define("util/Random", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Random;
    (function (Random) {
        function choice(...choices) {
            return choices.length === 0 ? undefined : choices[int(choices.length)];
        }
        Random.choice = choice;
        function int(min, max) {
            return Math.floor(float(min, max));
        }
        Random.int = int;
        function float(min, max) {
            if (max === undefined) {
                max = min;
                min = 0;
            }
            if (min > max) {
                [min, max] = [max, min];
            }
            return min + Math.random() * (max - min);
        }
        Random.float = float;
        function chance(chance) {
            if (chance <= 0)
                return false;
            if (chance >= 1)
                return true;
            return Math.random() <= chance;
        }
        Random.chance = chance;
    })(Random || (Random = {}));
    exports.default = Random;
});
define("ui/Canvas", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Canvas {
        constructor() {
            this.element = document.createElement("canvas");
            this.context = this.element.getContext("2d");
        }
        get width() {
            return this.element.width;
        }
        get height() {
            return this.element.height;
        }
        appendTo(element) {
            element.appendChild(this.element);
            return this;
        }
        setSize(width, height) {
            this.element.width = width;
            this.element.height = height;
            return this;
        }
        setDisplaySize(width, height) {
            this.element.style.setProperty("--width", `${width}`);
            this.element.style.setProperty("--height", `${height}`);
            this.displaySize = { x: width, y: height };
            return this;
        }
        getDisplaySize() {
            return this.displaySize;
        }
        clear() {
            this.context.clearRect(0, 0, this.element.width, this.element.height);
            return this;
        }
        getOffset() {
            if (!this.offset)
                this.offset = { x: this.element.offsetLeft, y: this.element.offsetTop };
            return this.offset;
        }
        invalidateOffset() {
            delete this.offset;
        }
        render(canvas, x = 0, y = 0) {
            canvas.context.drawImage(this.element, x, y);
        }
    }
    exports.default = Canvas;
});
define("ui/Sprite", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Sprite {
        constructor(name) {
            this.name = name;
            const image = document.createElement("img");
            this.loaded = new Promise(resolve => {
                image.addEventListener("load", () => {
                    this.image = image;
                    resolve();
                });
            });
            image.src = `sprite/${name}.png`;
        }
        static get(name) {
            let sprite = this.sprites.get(name);
            if (!sprite)
                this.sprites.set(name, sprite = new Sprite(name));
            return sprite;
        }
        get width() {
            var _a, _b;
            return (_b = (_a = this.image) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 0;
        }
        get height() {
            var _a, _b;
            return (_b = (_a = this.image) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
        }
        render(canvas, x, y, w, h, sx, sy, sw, sh) {
            if (!this.image)
                return;
            if (w === undefined)
                canvas.context.drawImage(this.image, x, y);
            else if (sw === undefined)
                canvas.context.drawImage(this.image, w, h, sx, sy, x, y, sx, sy);
            else
                canvas.context.drawImage(this.image, sx, sy, sw, sh, x, y, w, h);
        }
    }
    exports.default = Sprite;
    Sprite.sprites = new Map();
});
define("util/Direction", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Directions = void 0;
    var Direction;
    (function (Direction) {
        Direction[Direction["None"] = 0] = "None";
        Direction[Direction["North"] = 1] = "North";
        Direction[Direction["East"] = 2] = "East";
        Direction[Direction["South"] = 4] = "South";
        Direction[Direction["West"] = 8] = "West";
    })(Direction || (Direction = {}));
    exports.default = Direction;
    var Directions;
    (function (Directions) {
        Directions.CARDINALS = [Direction.North, Direction.East, Direction.South, Direction.West];
        function move(x, y, direction) {
            switch (direction) {
                case Direction.North: return [x, y - 1];
                case Direction.East: return [x + 1, y];
                case Direction.South: return [x, y + 1];
                case Direction.West: return [x - 1, y];
            }
            return [x, y];
        }
        Directions.move = move;
    })(Directions = exports.Directions || (exports.Directions = {}));
});
define("util/Enums", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnumObject = exports.EnumProperty = void 0;
    var EnumProperty;
    (function (EnumProperty) {
        EnumProperty.KEYS = Symbol("KEYS");
        EnumProperty.VALUES = Symbol("VALUES");
        EnumProperty.ENTRIES = Symbol("ENTRIES");
    })(EnumProperty = exports.EnumProperty || (exports.EnumProperty = {}));
    var EnumObject;
    (function (EnumObject) {
        function get(enumObject) {
            return enumObject;
        }
        EnumObject.get = get;
    })(EnumObject = exports.EnumObject || (exports.EnumObject = {}));
    var Enums;
    (function (Enums) {
        function getNth(enumObject, n) {
            return values(enumObject)[n];
        }
        Enums.getNth = getNth;
        function getLength(enumObject) {
            return keys(enumObject).length;
        }
        Enums.getLength = getLength;
        function keys(enumObject) {
            const e = EnumObject.get(enumObject);
            if (!e[EnumProperty.KEYS]) {
                e[EnumProperty.KEYS] = Object.keys(e)
                    .filter(key => isNaN(+key));
            }
            return e[EnumProperty.KEYS];
        }
        Enums.keys = keys;
        function values(enumObject) {
            const e = EnumObject.get(enumObject);
            if (!e[EnumProperty.VALUES]) {
                e[EnumProperty.VALUES] = keys(enumObject)
                    .map(key => enumObject[key]);
            }
            return e[EnumProperty.VALUES];
        }
        Enums.values = values;
        function entries(enumObject) {
            const e = EnumObject.get(enumObject);
            if (!e[EnumProperty.ENTRIES]) {
                e[EnumProperty.ENTRIES] = keys(enumObject)
                    .map(key => [key, enumObject[key]]);
            }
            return e[EnumProperty.ENTRIES];
        }
        Enums.entries = entries;
    })(Enums || (Enums = {}));
    exports.default = Enums;
});
define("util/Sound", ["require", "exports", "util/Enums", "util/Random"], function (require, exports, Enums_1, Random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundType = void 0;
    var SoundType;
    (function (SoundType) {
        SoundType[SoundType["Hit"] = 0] = "Hit";
        SoundType[SoundType["Break"] = 1] = "Break";
        SoundType[SoundType["Metal"] = 2] = "Metal";
        SoundType[SoundType["Gem"] = 3] = "Gem";
        SoundType[SoundType["BreakGem"] = 4] = "BreakGem";
        SoundType[SoundType["Explode"] = 5] = "Explode";
        SoundType[SoundType["Unequip"] = 6] = "Unequip";
        SoundType[SoundType["Equip"] = 7] = "Equip";
        SoundType[SoundType["Assay"] = 8] = "Assay";
    })(SoundType = exports.SoundType || (exports.SoundType = {}));
    const versionCount = {
        [SoundType.Hit]: 5,
        [SoundType.Metal]: 4,
        [SoundType.Break]: 4,
        [SoundType.Gem]: 4,
        [SoundType.BreakGem]: 3,
        [SoundType.Explode]: 4,
        [SoundType.Unequip]: 4,
        [SoundType.Equip]: 4,
        [SoundType.Assay]: 1,
    };
    class Sound {
        constructor(name) {
            this.name = name;
            this.instances = [];
            const audio = new Audio(`sfx/${name}.mp3`);
            audio.addEventListener("canplaythrough", () => this.instances.push(audio));
        }
        static preload() {
            for (const sound of Enums_1.default.values(SoundType)) {
                for (let i = 0; i < versionCount[sound]; i++) {
                    Sound.get(sound, i);
                }
            }
        }
        static get(type, which = type === undefined ? 0 : Random_1.default.int(versionCount[type])) {
            if (type === undefined)
                return undefined;
            const name = `${SoundType[type].toLowerCase()}${which}`;
            let sprite = this.sounds.get(name);
            if (!sprite)
                this.sounds.set(name, sprite = new Sound(name));
            return sprite;
        }
        play() {
            if (!this.instances.length)
                return;
            for (const instance of this.instances) {
                if (instance.paused) {
                    instance.play();
                    return;
                }
            }
            const audio = this.instances[0].cloneNode();
            audio.play();
            this.instances.push(audio);
        }
    }
    exports.default = Sound;
    Sound.sounds = new Map();
});
define("game/Tile", ["require", "exports", "Constants", "ui/Sprite", "util/Direction", "util/Random", "util/Sound", "game/Stats"], function (require, exports, Constants_1, Sprite_1, Direction_1, Random_2, Sound_1, Stats_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TileCategory = exports.TileType = void 0;
    var DamageType;
    (function (DamageType) {
        DamageType[DamageType["None"] = 0] = "None";
        DamageType[DamageType["Mining"] = 1] = "Mining";
        DamageType[DamageType["Explosion"] = 2] = "Explosion";
        DamageType[DamageType["Invulnerable"] = Infinity] = "Invulnerable";
    })(DamageType || (DamageType = {}));
    var TileType;
    (function (TileType) {
        TileType[TileType["Rock"] = 0] = "Rock";
        TileType[TileType["Metal"] = 1] = "Metal";
        TileType[TileType["Grass"] = 2] = "Grass";
        TileType[TileType["Emerald"] = 3] = "Emerald";
        TileType[TileType["Cavern"] = 4] = "Cavern";
        TileType[TileType["Mineshaft"] = 5] = "Mineshaft";
        TileType[TileType["Explosives"] = 6] = "Explosives";
        TileType[TileType["Gold"] = 7] = "Gold";
    })(TileType = exports.TileType || (exports.TileType = {}));
    var TileCategory;
    (function (TileCategory) {
        TileCategory[TileCategory["Ore"] = 0] = "Ore";
    })(TileCategory = exports.TileCategory || (exports.TileCategory = {}));
    const LIGHT_MAX = 3;
    const tiles = {
        [TileType.Metal]: {
            hitSound: Sound_1.SoundType.Metal,
            breakable: DamageType.Explosion,
        },
        [TileType.Rock]: {
            hitSound: Sound_1.SoundType.Hit,
            mask: "rock",
            background: TileType.Rock,
            breakable: DamageType.Mining,
        },
        [TileType.Grass]: {
            hitSound: Sound_1.SoundType.Hit,
            mask: "rock",
            breakable: DamageType.Mining,
        },
        [TileType.Emerald]: {
            base: TileType.Rock,
            category: TileCategory.Ore,
            hitSound: Sound_1.SoundType.Gem,
            breakSound: Sound_1.SoundType.BreakGem,
            score: 2500,
        },
        [TileType.Gold]: {
            base: TileType.Rock,
            category: TileCategory.Ore,
            hitSound: Sound_1.SoundType.Gem,
            breakSound: Sound_1.SoundType.BreakGem,
            score: 500,
        },
        [TileType.Mineshaft]: {
            invisible: true,
            nonselectable: true,
            background: TileType.Rock,
            light: LIGHT_MAX + 1,
            onMouseRightClick(tile) {
                if (tile.context.world.stats.explosives <= 0)
                    return;
                tile.context.world.stats.explosives--;
                tile.context.world.setTile(tile.context.x, tile.context.y, TileType.Explosives);
                Sound_1.default.get(Sound_1.SoundType.Equip).play();
            },
        },
        [TileType.Cavern]: {
            invisible: true,
            nonselectable: true,
            background: TileType.Rock,
            update(tile) {
                if (tile.getLight() === LIGHT_MAX)
                    tile.remove(true);
            },
        },
        [TileType.Explosives]: {
            background: TileType.Rock,
            separated: true,
            onMouseDown(tile) {
                if (!tile.isAccessible())
                    return;
                tile.context.world.stats.addExplosive();
                tile.remove(true);
                Sound_1.default.get(Sound_1.SoundType.Unequip).play();
            },
            onMouseRightClick(tile) {
                if (!tile.isAccessible())
                    return;
                explodeExplosives(tile);
            },
            damage(tile, damageType) {
                if (damageType === DamageType.Explosion)
                    explodeExplosives(tile);
            },
        },
    };
    function explodeExplosives(tile) {
        var _a;
        tile.remove(true);
        Sound_1.default.get(Sound_1.SoundType.Explode).play();
        const range = Random_2.default.int(4, Random_2.default.int(5, Random_2.default.int(6, 8))); // use multiple calls to weight smaller explosions higher
        tile.context.world.particles.create(Sprite_1.default.get("explosion"), tile.context.x * Constants_1.TILE + Constants_1.TILE / 2, tile.context.y * Constants_1.TILE + Constants_1.TILE / 2, 128, range / 2);
        for (let y = -range + 1; y < range; y++) {
            const absY = Math.abs(y);
            for (let x = -range + 1; x < range; x++) {
                const damage = Math.max(0, range - (Math.abs(x) + absY));
                if (damage)
                    (_a = tile.context.world.getTile(tile.context.x + x, tile.context.y + y)) === null || _a === void 0 ? void 0 : _a.damage(DamageType.Explosion, damage * 2, false);
            }
        }
    }
    function getProperty(type, property, orElse) {
        var _a;
        let description = tiles[type];
        if (description[property] === undefined && description.base !== undefined)
            return getProperty(description.base, property);
        return (_a = description[property]) !== null && _a !== void 0 ? _a : orElse;
    }
    class Tile {
        constructor(type, world, x, y) {
            this.type = type;
            this.hovering = false;
            this.durability = Random_2.default.int(2, 4);
            this.breakAnim = 0;
            this.recalcLightTick = -1;
            this.context = { world, x, y };
        }
        get description() {
            return tiles[this.type];
        }
        remove(accessible) {
            this.context.world.removeTile(this.context.x, this.context.y, accessible);
            return this;
        }
        invalidate() {
            delete this.mask;
            this.recalcLightTick = this.context.world.stats.tick;
        }
        getMask() {
            if (this.mask === undefined)
                this.updateMask();
            return this.mask;
        }
        updateMask() {
            this.mask = Direction_1.default.None;
            if (!getProperty(this.type, "mask"))
                return;
            for (const direction of Direction_1.Directions.CARDINALS) {
                const tile = this.context.world.getTileInDirection(direction, this.context);
                if (!tile || tile.description.invisible || tile.description.separated)
                    this.mask |= direction;
            }
        }
        getLight() {
            var _a;
            let producedLight = getProperty(this.type, "light");
            if (producedLight)
                return producedLight;
            if (this.recalcLightTick !== undefined && this.recalcLightTick < this.context.world.stats.tick)
                this.updateLight();
            return (_a = this.light) !== null && _a !== void 0 ? _a : 0;
        }
        updateLight() {
            var _a;
            const tiles = Direction_1.Directions.CARDINALS
                .map(direction => this.context.world.getTileInDirection(direction, this.context));
            const maxLightLevel = Math.max(...tiles.map(tile => { var _a, _b; return tile ? (_b = (_a = getProperty(tile === null || tile === void 0 ? void 0 : tile.type, "light")) !== null && _a !== void 0 ? _a : tile === null || tile === void 0 ? void 0 : tile.light) !== null && _b !== void 0 ? _b : 0 : 0; }));
            this.light = maxLightLevel - 1;
            for (const tile of tiles)
                if (tile && ((_a = tile.light) !== null && _a !== void 0 ? _a : 0) < this.light - 1)
                    tile.invalidate();
            delete this.recalcLightTick;
        }
        static getSprite(type) {
            const description = tiles[type];
            const category = description.category === undefined ? "" : `/${TileCategory[description.category].toLowerCase()}`;
            return Sprite_1.default.get(`tile${category}/${TileType[type].toLowerCase()}`);
        }
        static render(tile, type, canvas, x, y, light, mask) {
            var _a;
            const description = tiles[type];
            if ((light !== null && light !== void 0 ? light : Infinity) <= 0 && (tile.context.world.stats.state === Stats_1.GameState.FellBehind || tile.revealed))
                light = 1;
            if (description.invisible && description.background === undefined || light === 0)
                return;
            if (light !== undefined && light < LIGHT_MAX)
                canvas.context.filter = `brightness(${Math.floor(light / LIGHT_MAX * 100)}%)`;
            if (!description.invisible) {
                if (description.base !== undefined)
                    Tile.render(tile, description.base, canvas, x, y, undefined, mask);
                Tile.getSprite(type).render(canvas, x, y);
                if (mask && description.mask) {
                    const maskSprite = Sprite_1.default.get(`tile/mask/${description.mask}`);
                    canvas.context.globalCompositeOperation = "destination-out";
                    if (mask & Direction_1.default.North)
                        maskSprite.render(canvas, x, y, 0, 0, Constants_1.TILE, Constants_1.TILE);
                    if (mask & Direction_1.default.East)
                        maskSprite.render(canvas, x, y, Constants_1.TILE, 0, Constants_1.TILE, Constants_1.TILE);
                    if (mask & Direction_1.default.South)
                        maskSprite.render(canvas, x, y, Constants_1.TILE, Constants_1.TILE, Constants_1.TILE, Constants_1.TILE);
                    if (mask & Direction_1.default.West)
                        maskSprite.render(canvas, x, y, 0, Constants_1.TILE, Constants_1.TILE, Constants_1.TILE);
                }
            }
            canvas.context.globalCompositeOperation = "destination-over";
            if (description.background !== undefined && ((_a = tile === null || tile === void 0 ? void 0 : tile.context.y) !== null && _a !== void 0 ? _a : 0) >= Constants_1.SURFACE_TILES)
                Sprite_1.default.get(`tile/background/${TileType[description.background].toLowerCase()}`).render(canvas, x, y);
            if (light !== undefined)
                canvas.context.filter = "none";
            canvas.context.globalCompositeOperation = "source-over";
        }
        render(canvas, x, y) {
            Tile.render(this, this.type, canvas, x, y, this.getLight(), this.getMask());
            if (this.breakAnim)
                Sprite_1.default.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);
            if (this.hovering && this.isAccessible())
                Sprite_1.default.get("ui/hover").render(canvas, x, y);
        }
        update() {
            var _a, _b;
            (_b = (_a = tiles[this.type]).update) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        }
        isAccessible() {
            return this.light === LIGHT_MAX && !tiles[this.type].nonselectable;
        }
        isMineable() {
            return this.isAccessible() && DamageType.Mining >= getProperty(this.type, "breakable", DamageType.Invulnerable);
        }
        onMouseEnter() {
            this.hovering = true;
            this.handleEvent("onMouseEnter");
        }
        onMouseLeave() {
            this.hovering = false;
            this.handleEvent("onMouseLeave");
        }
        onMouseClick(x, y) {
            this.handleEvent("onMouseClick", x, y);
        }
        onMouseRightClick(x, y) {
            var _a;
            this.handleEvent("onMouseRightClick", x, y);
            if (((_a = this.getLight()) !== null && _a !== void 0 ? _a : 0) > 0 || this.context.world.stats.score < this.context.world.stats.assayCost)
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
                Sound_1.default.get(Sound_1.SoundType.Assay).play();
            }
        }
        onMouseDown(x, y) {
            this.handleEvent("onMouseDown", x, y);
        }
        onMouseUp(x, y) {
            this.handleEvent("onMouseUp", x, y);
        }
        damage(damageType, amount = 1, effects = true) {
            var _a, _b;
            if (this.durability < 0)
                return;
            (_a = getProperty(this.type, "damage")) === null || _a === void 0 ? void 0 : _a(this, damageType, amount);
            let dealtDamage = false;
            if (damageType >= getProperty(this.type, "breakable", DamageType.Invulnerable)) {
                this.durability -= amount;
                dealtDamage = true;
                if (this.durability < 0) {
                    this.break(damageType, effects);
                    return;
                }
                this.breakAnim++;
            }
            if (effects) {
                (_b = Sound_1.default.get(getProperty(this.type, "hitSound"))) === null || _b === void 0 ? void 0 : _b.play();
                if (dealtDamage)
                    this.particles(2);
            }
        }
        break(damageType, effects = true) {
            var _a, _b;
            this.context.world.removeTile(this.context.x, this.context.y, true);
            this.context.world.stats.score += (_a = tiles[this.type].score) !== null && _a !== void 0 ? _a : 0;
            if (damageType === DamageType.Mining)
                this.context.world.stats.dig();
            if (effects) {
                Sound_1.default.get((_b = getProperty(this.type, "breakSound")) !== null && _b !== void 0 ? _b : Sound_1.SoundType.Break).play();
                this.particles(16);
            }
        }
        particles(amount) {
            this.context.world.particles.create(Tile.getSprite(this.type), this.context.x * Constants_1.TILE + Constants_1.TILE / 2, this.context.y * Constants_1.TILE + Constants_1.TILE / 2, amount);
        }
        onMouseHold(x, y) {
            if (this.handleEvent("onMouseHold", x, y) === false)
                return;
            if (!this.hovering || !this.isAccessible())
                return;
            if (this.context.world.stats.exhaustion)
                return;
            this.context.world.stats.exhaustion = 10;
            this.damage(DamageType.Mining);
        }
        handleEvent(event, x, y) {
            var _a, _b;
            return (_b = (_a = tiles[this.type])[event]) === null || _b === void 0 ? void 0 : _b.call(_a, this, x, y);
        }
    }
    exports.default = Tile;
});
define("util/Color", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Color = void 0;
    class Color {
        constructor(red, blue, green) {
            this.red = red;
            this.blue = blue;
            this.green = green;
        }
        getID() {
            return `color0x${this.toInt().toString(16).padStart(6, "0")}`;
        }
        getSVGColorMatrix() {
            return `${this.red / 255} 0 0 0 0 0 ${this.green / 255} 0 0 0 0 0 ${this.blue / 255} 0 0 0 0 0 1 0`;
        }
        static fromInt(int) {
            return new Color((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF);
        }
        toInt() {
            let int = this.red;
            int = (int << 8) + this.green;
            int = (int << 8) + this.blue;
            return int;
        }
    }
    exports.Color = Color;
    Color.BLACK = new Color(0, 0, 0);
    Color.WHITE = new Color(255, 255, 255);
});
define("ui/Text", ["require", "exports", "util/Color", "util/Enums", "ui/Canvas", "ui/Sprite"], function (require, exports, Color_1, Enums_2, Canvas_1, Sprite_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Text = exports.Align = void 0;
    const CHAR_WIDTH = 6;
    const CHAR_HEIGHT = 9;
    var FontSprite;
    (function (FontSprite) {
        FontSprite[FontSprite["Uppercase"] = 0] = "Uppercase";
        FontSprite[FontSprite["Lowercase"] = 1] = "Lowercase";
        FontSprite[FontSprite["Numbers"] = 2] = "Numbers";
        FontSprite[FontSprite["Period"] = 3] = "Period";
        FontSprite[FontSprite["Comma"] = 4] = "Comma";
        FontSprite[FontSprite["Exclamation"] = 5] = "Exclamation";
        FontSprite[FontSprite["Colon"] = 6] = "Colon";
        FontSprite[FontSprite["Parentheses"] = 7] = "Parentheses";
        FontSprite[FontSprite["Currency"] = 8] = "Currency";
    })(FontSprite || (FontSprite = {}));
    const fontSpriteDefinitions = {
        [FontSprite.Uppercase]: { start: "A".charCodeAt(0), end: "Z".charCodeAt(0) },
        [FontSprite.Lowercase]: { start: "a".charCodeAt(0), end: "z".charCodeAt(0) },
        [FontSprite.Numbers]: { start: "0".charCodeAt(0), end: "9".charCodeAt(0) },
        [FontSprite.Parentheses]: { start: "(".charCodeAt(0), end: ")".charCodeAt(0) },
        [FontSprite.Period]: ".".charCodeAt(0),
        [FontSprite.Comma]: ",".charCodeAt(0),
        [FontSprite.Exclamation]: "!".charCodeAt(0),
        [FontSprite.Colon]: ":".charCodeAt(0),
        [FontSprite.Currency]: "$".charCodeAt(0),
    };
    const characterWidthExceptions = {
        I: 5,
        T: 5,
        i: 3,
        j: 5,
        l: 4,
        r: 5,
        1: 5,
        ",": 3,
        ".": 3,
        "!": 3,
        ":": 3,
        "(": 4,
        ")": 4,
    };
    const SVG = "http://www.w3.org/2000/svg";
    var Align;
    (function (Align) {
        Align[Align["Left"] = 0] = "Left";
        Align[Align["Centre"] = 1] = "Centre";
        Align[Align["Right"] = 2] = "Right";
    })(Align = exports.Align || (exports.Align = {}));
    class Text {
        constructor(text, color, maxWidth = Infinity, scale = 1, align = Align.Left) {
            this.text = text;
            this.color = color;
            this.maxWidth = maxWidth;
            this.scale = scale;
            this.align = align;
            this.generating = false;
        }
        getLayout() {
            var _a;
            if (!this.layout) {
                let width = 0;
                let lineWidth = 0;
                let wordWidth = 0;
                let height = CHAR_HEIGHT * this.scale;
                let needsToAddSplit = false;
                let splits = [];
                for (let i = 0; i < this.text.length; i++) {
                    const char = this.text[i];
                    if (char === " " || char === "\n") {
                        lineWidth += wordWidth;
                        wordWidth = 0;
                        if (needsToAddSplit || char === "\n") {
                            if (char === "\n")
                                splits.push({ index: i, lineWidth: -1 });
                            splits[splits.length - 1].index = i;
                        }
                        needsToAddSplit = false;
                    }
                    const charWidth = ((_a = characterWidthExceptions[char]) !== null && _a !== void 0 ? _a : CHAR_WIDTH) * this.scale;
                    wordWidth += charWidth;
                    if (lineWidth + wordWidth > this.maxWidth || char === "\n") {
                        height += CHAR_HEIGHT * this.scale;
                        width = Math.max(lineWidth, width);
                        if (char !== "\n")
                            splits.push({ index: -1, lineWidth });
                        splits[splits.length - 1].lineWidth = lineWidth;
                        lineWidth = 0;
                        needsToAddSplit = char !== "\n"; // we've already added the split for newlines, but otherwise split at the next space
                    }
                }
                lineWidth += wordWidth;
                width = Math.max(lineWidth, width);
                height += this.scale; // we render a shadow, so we need to add 1px (multiplied by scale)
                splits.push({ index: Infinity, lineWidth });
                this.layout = [width, height, splits];
            }
            return this.layout;
        }
        render(canvas, x, y) {
            var _a;
            (_a = this.getImage()) === null || _a === void 0 ? void 0 : _a.render(canvas, x, y);
        }
        getImage() {
            if (!this.image && !this.generating) {
                this.generating = true;
                this.rendered = this.generateImage();
            }
            return this.image;
        }
        waitForRendered() {
            this.getImage();
            return this.rendered;
        }
        async generateImage() {
            const result = new Canvas_1.default();
            const [width, height, splits] = this.getLayout();
            result.setSize(width, height);
            const shadow = new Canvas_1.default();
            shadow.setSize(width, height);
            await this.renderText(shadow, this.scale, splits, Color_1.Color.BLACK);
            const top = new Canvas_1.default();
            top.setSize(width, height);
            await this.renderText(top, 0, splits);
            shadow.render(result);
            top.render(result);
            this.image = result;
        }
        async renderText(canvas, y, splits, color = this.color) {
            var _a, _b, _c;
            const svg = document.createElementNS(SVG, "svg");
            const filter = document.createElementNS(SVG, "filter");
            filter.id = color.getID();
            const matrix = document.createElementNS(SVG, "feColorMatrix");
            matrix.setAttribute("type", "matrix");
            matrix.setAttribute("color-interpolation-filters", "sRGB");
            matrix.setAttribute("values", color.getSVGColorMatrix());
            filter.appendChild(matrix);
            svg.appendChild(filter);
            document.body.appendChild(svg);
            canvas.context.filter = `url(#${filter.id})`;
            let x;
            let splitIndex = 0;
            for (let i = 0; i < this.text.length; i++) {
                const split = splits[splitIndex];
                if (x === undefined) {
                    switch (this.align) {
                        case Align.Left:
                            x = 0;
                            break;
                        case Align.Centre:
                            x = canvas.width / 2 - ((_a = split === null || split === void 0 ? void 0 : split.lineWidth) !== null && _a !== void 0 ? _a : 0) / 2;
                            break;
                        case Align.Right:
                            x = canvas.width - ((_b = split === null || split === void 0 ? void 0 : split.lineWidth) !== null && _b !== void 0 ? _b : 0);
                            break;
                    }
                }
                const char = this.text[i];
                if (char !== " " && char !== "\n") {
                    const code = this.text.charCodeAt(i);
                    const fontSprite = this.getFontSprite(code);
                    if (fontSprite !== undefined) {
                        const sprite = Sprite_2.default.get(`ui/font/${FontSprite[fontSprite].toLowerCase()}`);
                        await sprite.loaded;
                        const def = fontSpriteDefinitions[fontSprite];
                        canvas.context.imageSmoothingEnabled = false;
                        sprite.render(canvas, x, y, CHAR_WIDTH * this.scale, CHAR_HEIGHT * this.scale, typeof def === "number" ? 0 : (code - def.start) * CHAR_WIDTH, 0, CHAR_WIDTH, CHAR_HEIGHT);
                    }
                }
                x += ((_c = characterWidthExceptions[char]) !== null && _c !== void 0 ? _c : CHAR_WIDTH) * this.scale;
                if ((split === null || split === void 0 ? void 0 : split.index) === i) {
                    splitIndex++;
                    x = undefined;
                    y += CHAR_HEIGHT * this.scale;
                }
            }
            canvas.context.filter = "none";
            svg.remove();
        }
        getFontSprite(char) {
            for (const fontSprite of Enums_2.default.values(FontSprite)) {
                const definition = fontSpriteDefinitions[fontSprite];
                const matches = typeof definition === "number" ? definition === char
                    : char >= definition.start && char <= definition.end;
                if (matches)
                    return fontSprite;
            }
            return undefined;
        }
    }
    exports.Text = Text;
});
define("ui/MutableText", ["require", "exports", "util/Color", "ui/Text"], function (require, exports, Color_2, Text_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MutableText = void 0;
    class MutableText {
        constructor(getter) {
            this.getter = getter;
            this.color = Color_2.Color.WHITE;
            this.maxWidth = Infinity;
            this.scale = 1;
            this.align = Text_1.Align.Left;
            this.refresh();
        }
        setText(getter) {
            this.getter = getter;
            this.refresh();
            return this;
        }
        setColor(color) {
            this.color = color;
            this.refresh();
            return this;
        }
        setMaxWidth(width) {
            this.maxWidth = width;
            this.refresh();
            return this;
        }
        setScale(scale) {
            this.scale = scale;
            this.refresh();
            return this;
        }
        setAlign(align) {
            this.align = align;
            this.refresh();
            return this;
        }
        refresh() {
            var _a, _b, _c, _d;
            const text = this.getter();
            const shouldRefresh = ((_a = this.text) === null || _a === void 0 ? void 0 : _a.text) !== text
                || this.color !== ((_b = this.text) === null || _b === void 0 ? void 0 : _b.color)
                || this.maxWidth !== ((_c = this.text) === null || _c === void 0 ? void 0 : _c.maxWidth)
                || this.scale !== ((_d = this.text) === null || _d === void 0 ? void 0 : _d.scale)
                || this.align !== this.text.align;
            if (shouldRefresh) {
                if (!text.length) {
                    delete this.text;
                    return;
                }
                const newText = new Text_1.Text(text, this.color, this.maxWidth, this.scale, this.align);
                newText.waitForRendered().then(() => this.text = newText);
            }
        }
        render(canvas, x, y) {
            var _a;
            this.refresh();
            (_a = this.text) === null || _a === void 0 ? void 0 : _a.render(canvas, x, y);
        }
        getLayout() {
            var _a;
            return (_a = this.text) === null || _a === void 0 ? void 0 : _a.getLayout();
        }
    }
    exports.MutableText = MutableText;
});
define("ui/Ui", ["require", "exports", "game/Stats", "ui/MutableText", "ui/Text"], function (require, exports, Stats_2, MutableText_1, Text_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ui = void 0;
    class Ui {
        constructor(stats) {
            this.stats = stats;
            this.score = new MutableText_1.MutableText(() => [
                ...this.stats.state === Stats_2.GameState.Surface ? [
                    ...!this.stats.highscore ? [] : [`Highest stock value: $${this.stats.highscore}`],
                ] : [
                    ...this.stats.turn * 10 === this.stats.score ? [] : [`Stock value: $${this.stats.score}`],
                    `Mined depth: ${this.stats.turn}`,
                ],
            ].join("\n"));
            this.abilities = new MutableText_1.MutableText(() => [
                "ABILITIES: Right Click ",
                ...!this.stats.discoveredAssays ? []
                    : [`Assay cost: $${this.stats.assayCost}`],
                ...this.stats.explosives === Stats_2.NOT_DISCOVERED ? []
                    : [`Explosives: Have ${this.stats.explosives}`],
            ].join("\n"))
                .setAlign(Text_2.Align.Right);
            this.title = new MutableText_1.MutableText(() => this.stats.state === Stats_2.GameState.Surface ? "DIG DIG DIG"
                : "GAME OVER!")
                .setScale(4);
            this.author = new MutableText_1.MutableText(() => "by Chirichirichiri")
                .setScale(2);
            this.hint = new MutableText_1.MutableText(() => this.stats.state === Stats_2.GameState.Surface ? "Use the mouse to start mining!"
                : "Click anywhere to play again!");
        }
        render(canvas) {
            var _a, _b, _c, _d, _e;
            let width;
            let height;
            if (this.stats.state !== Stats_2.GameState.Mining) {
                [width, height] = (_a = this.title.getLayout()) !== null && _a !== void 0 ? _a : [0, 0];
                this.title.render(canvas, canvas.width / 2 - width / 2, canvas.height / 4 - height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));
            }
            if (this.stats.state === Stats_2.GameState.Surface) {
                const titleXEnd = canvas.width / 2 + width / 2;
                const titleYEnd = canvas.height / 4 + height / 2;
                [width, height] = (_b = this.author.getLayout()) !== null && _b !== void 0 ? _b : [0, 0];
                this.author.render(canvas, titleXEnd - width, titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));
            }
            if (this.stats.state !== Stats_2.GameState.Mining) {
                [width, height] = (_c = this.hint.getLayout()) !== null && _c !== void 0 ? _c : [0, 0];
                this.hint.render(canvas, canvas.width - width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3), canvas.height - height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));
            }
            [width, height] = (_d = this.score.getLayout()) !== null && _d !== void 0 ? _d : [0, 0];
            this.score.render(canvas, 5, canvas.height - height - 2);
            if (this.stats.state === Stats_2.GameState.Mining && this.stats.explosives !== Stats_2.NOT_DISCOVERED || this.stats.discoveredAssays) {
                [width, height] = (_e = this.abilities.getLayout()) !== null && _e !== void 0 ? _e : [0, 0];
                this.abilities.render(canvas, canvas.width - width + 1, canvas.height - height - 2);
            }
        }
        onMouseDown() {
            if (this.stats.state === Stats_2.GameState.FellBehind)
                this.stats.reset();
        }
    }
    exports.Ui = Ui;
});
define("ui/Mouse", ["require", "exports", "Constants", "game/Stats"], function (require, exports, Constants_2, Stats_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mouse = void 0;
    class Mouse {
        constructor() {
            this.held = false;
            this.x = 0;
            this.y = 0;
            window.addEventListener("mousemove", event => this.onMove(event));
            window.addEventListener("click", event => this.onClick(event));
            window.addEventListener("mousedown", event => this.onDown(event));
            window.addEventListener("mouseup", event => this.onUp(event));
            window.addEventListener("contextmenu", event => this.onRightClick(event));
        }
        setCanvas(canvas) {
            this.canvas = canvas;
            return this;
        }
        setWorld(world) {
            this.world = world;
            return this;
        }
        setView(view) {
            this.view = view;
            return this;
        }
        setUi(ui) {
            this.ui = ui;
            return this;
        }
        update() {
            var _a;
            if (this.held)
                (_a = this.tile) === null || _a === void 0 ? void 0 : _a.onMouseHold(this.x, this.y);
        }
        updatePosition(event) {
            var _a, _b, _c, _d, _e, _f, _g;
            const oldX = this.x;
            const oldY = this.y;
            const x = this.x = (_c = (_a = event === null || event === void 0 ? void 0 : event.clientX) !== null && _a !== void 0 ? _a : (_b = event === null || event === void 0 ? void 0 : event.touches) === null || _b === void 0 ? void 0 : _b[0].clientX) !== null && _c !== void 0 ? _c : this.x;
            const y = this.y = (_f = (_d = event === null || event === void 0 ? void 0 : event.clientY) !== null && _d !== void 0 ? _d : (_e = event === null || event === void 0 ? void 0 : event.touches) === null || _e === void 0 ? void 0 : _e[0].clientY) !== null && _f !== void 0 ? _f : this.y;
            if (x !== oldX || y !== oldY)
                this.emitMouseEvent("onMouseMove", this.ui);
            const newTile = this.calculateTarget(x, y);
            if (this.tile === newTile)
                return;
            (_g = this.tile) === null || _g === void 0 ? void 0 : _g.onMouseLeave();
            this.tile = newTile !== null && newTile !== void 0 ? newTile : undefined;
            newTile === null || newTile === void 0 ? void 0 : newTile.onMouseEnter();
        }
        calculateTarget(x, y) {
            if (!this.canvas || !this.world || !this.view)
                return undefined;
            const canvasOffset = this.canvas.getOffset();
            x -= canvasOffset.x;
            y -= canvasOffset.y;
            const canvasSize = this.canvas.getDisplaySize();
            if (x < 0 || x > canvasSize.x || y < 0 || y > canvasSize.y)
                return undefined;
            const size = Constants_2.TILES * Constants_2.TILE;
            x *= size / canvasSize.x;
            y *= size / canvasSize.y;
            if (this.world.stats.state === Stats_3.GameState.FellBehind)
                return undefined;
            return this.calculateTileTarget(x, y);
        }
        calculateTileTarget(x, y) {
            y += this.view.y;
            x = Math.floor(x / Constants_2.TILE);
            y = Math.floor(y / Constants_2.TILE);
            return this.world.getTile(x, y);
        }
        onMove(event) {
            this.updatePosition(event);
        }
        onClick(event) {
            this.updatePosition(event);
            this.emitMouseEvent("onMouseClick", this.tile, this.ui);
        }
        onRightClick(event) {
            var _a;
            if (event.target.tagName === "CANVAS")
                (_a = event.preventDefault) === null || _a === void 0 ? void 0 : _a.call(event);
            this.updatePosition(event);
            this.emitMouseEvent("onMouseRightClick", this.tile, this.ui);
        }
        onDown(event) {
            if (event.button === 2)
                return;
            this.updatePosition(event);
            this.held = true;
            this.emitMouseEvent("onMouseDown", this.tile, this.ui);
            this.emitMouseEvent("onMouseHold", this.tile, this.ui);
        }
        onUp(event) {
            this.updatePosition(event);
            this.emitMouseEvent("onMouseUp", this.tile, this.ui);
            this.held = false;
        }
        emitMouseEvent(event, ...handlers) {
            var _a;
            for (const handler of handlers)
                (_a = handler === null || handler === void 0 ? void 0 : handler[event]) === null || _a === void 0 ? void 0 : _a.call(handler, this.x, this.y);
        }
    }
    exports.Mouse = Mouse;
});
define("ui/View", ["require", "exports", "Constants", "game/Stats", "ui/Sprite"], function (require, exports, Constants_3, Stats_4, Sprite_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    const VIEW_PADDING_TILES = 6;
    class View {
        constructor() {
            this.y = 0;
            this.step = 0;
        }
        getTopVisibleRowY() {
            return Math.floor(this.y / Constants_3.TILE);
        }
        getTopAccessibleRowY() {
            return Math.ceil(this.y / Constants_3.TILE);
        }
        getBottomVisibleRowY() {
            return Math.ceil((this.y + Constants_3.TILES * Constants_3.TILE) / Constants_3.TILE);
        }
        update(world, stats, mouse) {
            this.step++;
            if (stats.state === Stats_4.GameState.FellBehind) {
                if (this.step < -300 + 32 && this.step % 2)
                    this.y++;
                if (this.step > 0 && this.step % 2 && this.y > 0)
                    this.y--;
                return;
            }
            if (stats.state === Stats_4.GameState.Surface) {
                this.y = 0;
                return;
            }
            const bottomRow = this.getBottomVisibleRowY();
            if (this.step > 0 && (stats.dug > this.y / Constants_3.TILE || world.hasMineshaft(bottomRow - VIEW_PADDING_TILES)))
                this.step = -32;
            if (this.step <= 0 && this.step % 2) {
                this.y++;
                mouse.updatePosition();
                world.generateFor(bottomRow + 1);
                if (this.y % 16 === 0) {
                    stats.passTurn();
                    stats.score += 10;
                }
            }
            let hasMineshaft = false;
            for (let y = this.getTopAccessibleRowY(); y < bottomRow; y++)
                if (world.hasMineshaft(y)) {
                    hasMineshaft = true;
                    break;
                }
            if (!hasMineshaft && stats.state === Stats_4.GameState.Mining) {
                stats.endGame();
                this.step = -300;
            }
        }
        render(world, canvas) {
            const topY = this.getTopVisibleRowY();
            const bottomY = this.getBottomVisibleRowY();
            for (let y = topY; y <= bottomY; y++) {
                for (let x = 0; x < Constants_3.TILES; x++) {
                    const tile = world.getTile(x, y);
                    tile === null || tile === void 0 ? void 0 : tile.render(canvas, x * Constants_3.TILE, y * Constants_3.TILE - this.y);
                }
            }
            canvas.context.globalCompositeOperation = "destination-over";
            Sprite_3.default.get("background/surface").render(canvas, 0, -this.y);
            canvas.context.globalCompositeOperation = "source-over";
        }
    }
    exports.View = View;
});
define("ui/Particles", ["require", "exports", "util/Maths", "util/Random"], function (require, exports, Maths_1, Random_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Particles = void 0;
    class Particles {
        constructor() {
            this.particles = [];
        }
        create(sprite, x, y, count, speedMultiplier = 1) {
            for (let i = 0; i < count; i++) {
                const [xv, yv] = Maths_1.default.direction(Random_3.default.float(Math.PI * 2), Random_3.default.float(2, 4) * speedMultiplier);
                this.particles.push({
                    sprite,
                    x, y,
                    xv, yv,
                    xo: Random_3.default.float(0.75), yo: Random_3.default.float(0.75),
                    life: 500,
                });
            }
        }
        update() {
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                particle.xv *= 0.95;
                particle.yv *= 0.95;
                particle.yv += 0.3;
                particle.x += particle.xv;
                particle.y += particle.yv;
                particle.life--;
                if (particle.life <= 0) {
                    // delete particle by moving last particle to this position, then popping
                    this.particles[i] = this.particles[this.particles.length - 1];
                    this.particles.pop();
                }
            }
        }
        render(canvas, view) {
            for (const particle of this.particles)
                particle.sprite.render(canvas, particle.x, particle.y - view.y, Math.floor(particle.sprite.width * particle.xo), Math.floor(particle.sprite.height * particle.yo), particle.sprite.width / 4, particle.sprite.height / 4);
        }
    }
    exports.Particles = Particles;
});
define("game/World", ["require", "exports", "Constants", "util/Direction", "util/Maths", "util/Random", "game/Stats", "game/Tile"], function (require, exports, Constants_4, Direction_2, Maths_2, Random_4, Stats_5, Tile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const BLANK_ROWS = Constants_4.TILES - 1;
    class World {
        constructor(stats) {
            this.stats = stats;
            this.tiles = [];
            this.mineshaft = [];
            this.generateNewWorld();
        }
        setParticles(particles) {
            this.particles = particles;
        }
        setTile(x, y, type) {
            this.invalidateAdjacentTiles(x, y);
            if (type === Tile_1.TileType.Mineshaft)
                this.mineshaft[y] = true;
            return this.tiles[y][x] = new Tile_1.default(type, this, x, y);
        }
        removeTile(x, y, accessible) {
            this.invalidateAdjacentTiles(x, y);
            this.setTile(x, y, accessible ? Tile_1.TileType.Mineshaft : Tile_1.TileType.Cavern);
        }
        getTile(x, y) {
            var _a;
            if (!this.tiles[y])
                return null;
            if (x < 0 || x >= Constants_4.TILES)
                return null;
            return (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a[x];
        }
        getTileInDirection(direction, context, y) {
            return this.getTile(...Direction_2.Directions.move(typeof context === "number" ? context : context.x, typeof context === "number" ? y : context.y, direction));
        }
        setHasMineable(y) {
            this.mineshaft[y] = true;
        }
        hasMineshaft(y) {
            var _a, _b;
            let mineshaft = this.mineshaft[y];
            if (mineshaft === undefined)
                mineshaft = this.mineshaft[y] = (_b = (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a.some(tile => tile.type === Tile_1.TileType.Mineshaft)) !== null && _b !== void 0 ? _b : false;
            return mineshaft;
        }
        generateFor(y) {
            while (this.tiles.length < y)
                this.generateRows();
        }
        generateRow(tileType) {
            const y = this.tiles.length;
            const row = [];
            this.tiles.push(row);
            for (let x = 0; x < Constants_4.TILES; x++)
                this.setTile(x, y, tileType);
        }
        generateRows(rows = Random_4.default.int(5, 20)) {
            for (let i = 0; i < rows; i++)
                this.generateRow(Tile_1.TileType.Rock);
            const below = this.tiles.length - rows;
            while (Random_4.default.chance(Maths_2.default.lerp(0.4, 0.6, this.stats.difficulty)))
                this.generateMetalRemains(below);
            while (Random_4.default.chance(Maths_2.default.lerp(0.6, 0.3, this.stats.difficulty)))
                this.generateCave(below);
            while (Random_4.default.chance(0.8)) {
                const size = Random_4.default.int(1, 4);
                let x = Random_4.default.int(0, Constants_4.TILES);
                let y = Random_4.default.int(this.tiles.length - rows, this.tiles.length);
                this.generateVeinAt(Tile_1.TileType.Gold, size, x, y, Tile_1.TileType.Rock);
            }
            if (Random_4.default.chance(0.1)) {
                const size = Random_4.default.int(1, 3);
                let x = Random_4.default.int(0, Constants_4.TILES);
                let y = Random_4.default.int(this.tiles.length - rows, this.tiles.length);
                this.generateVeinAt(Tile_1.TileType.Emerald, size, x, y, Tile_1.TileType.Rock);
            }
            // clean up old tiles
            // while (this.tiles.length - this.first > TILES * 2)
            // 	delete this.tiles[this.first++];
            // increment this.first
            while (this.tiles.length - this.first++ > Constants_4.TILES * 2)
                ;
        }
        update() {
            if (this.stats.state === Stats_5.GameState.Surface && this.tiles.length > BLANK_ROWS + 4) {
                this.generateNewWorld();
                return;
            }
            let y = this.first;
            let row;
            while (row = this.tiles[++y])
                for (const tile of row)
                    tile === null || tile === void 0 ? void 0 : tile.update();
        }
        invalidateAdjacentTiles(x, y) {
            var _a;
            for (const direction of Direction_2.Directions.CARDINALS)
                (_a = this.getTileInDirection(direction, x, y)) === null || _a === void 0 ? void 0 : _a.invalidate();
        }
        generateNewWorld() {
            this.first = -1;
            this.tiles.splice(0, Infinity);
            this.mineshaft.splice(0, Infinity);
            for (let i = 0; i < BLANK_ROWS; i++)
                this.generateRow(Tile_1.TileType.Mineshaft);
            this.generateRow(Tile_1.TileType.Grass);
            this.generateRow(Tile_1.TileType.Rock);
            this.generateRow(Tile_1.TileType.Rock);
        }
        generateCave(below) {
            this.generateVeinBelow(Tile_1.TileType.Cavern, Random_4.default.int(10, 30), below, Tile_1.TileType.Rock);
        }
        generateVeinBelow(type, size, below, replace) {
            this.generateVeinAt(type, size, Random_4.default.int(Constants_4.TILES), Random_4.default.int(below, this.tiles.length), replace);
        }
        generateVeinAt(type, size, x, y, replace) {
            var _a;
            for (let i = 0; i < size; i++) {
                if (replace === undefined || ((_a = this.getTile(x, y)) === null || _a === void 0 ? void 0 : _a.type) === replace)
                    this.setTile(x, y, type);
                [x, y] = Direction_2.Directions.move(x, y, Random_4.default.choice(...Direction_2.Directions.CARDINALS));
            }
        }
        generateMetalRemains(below) {
            this.generateStructure(below, {
                border: {
                    type: Tile_1.TileType.Metal,
                    decay: [{ type: Tile_1.TileType.Cavern, chance: Maths_2.default.lerp(0.3, 0.1, this.stats.difficulty) }],
                },
                inside: {
                    type: Tile_1.TileType.Cavern,
                    decay: [
                        { type: Tile_1.TileType.Metal, chance: 0.1 },
                        { type: Tile_1.TileType.Explosives, chance: Maths_2.default.lerp(0.1, 0, Math.max(0, this.stats.explosives) / 5) },
                    ],
                },
                width: Random_4.default.int(4, Maths_2.default.lerp(6, 12, this.stats.difficulty)),
                height: Random_4.default.int(4, 6),
            });
        }
        generateStructure(below, options) {
            if (options.border === undefined && options.inside === undefined)
                return; // nothing to generate
            const maxY = this.tiles.length - options.height;
            if (maxY <= below)
                return;
            let x = Random_4.default.int(Constants_4.TILES);
            let y = Random_4.default.int(below, maxY);
            for (let yi = 0; yi < options.height; yi++) {
                for (let xi = 0; xi < options.width; xi++) {
                    const isBorder = xi === 0 || yi === 0 || xi === options.width - 1 || yi === options.height - 1;
                    const generationOptions = options[isBorder ? "border" : "inside"];
                    if (generationOptions === undefined)
                        continue;
                    const generate = this.resolveGenerationOptions(generationOptions);
                    this.setTile(x + xi, y + yi, generate);
                }
            }
        }
        resolveGenerationOptions(options) {
            var _a, _b;
            if (typeof options === "number")
                return options;
            for (const decay of (_a = options.decay) !== null && _a !== void 0 ? _a : [])
                if (Random_4.default.chance((_b = decay === null || decay === void 0 ? void 0 : decay.chance) !== null && _b !== void 0 ? _b : 0))
                    return this.resolveGenerationOptions(decay);
            return options.type;
        }
    }
    exports.default = World;
});
define("dig", ["require", "exports", "Constants", "game/Stats", "game/World", "ui/Canvas", "ui/Mouse", "ui/Particles", "ui/Ui", "ui/View", "util/Sound"], function (require, exports, Constants_5, Stats_6, World_1, Canvas_2, Mouse_1, Particles_1, Ui_1, View_1, Sound_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mouse = exports.ui = exports.canvas = exports.particles = exports.view = exports.world = exports.stats = void 0;
    ////////////////////////////////////
    // Game
    //
    exports.stats = new Stats_6.Stats();
    exports.world = new World_1.default(exports.stats);
    exports.view = new View_1.View();
    ////////////////////////////////////
    // UI
    //
    Sound_2.default.preload();
    exports.particles = new Particles_1.Particles();
    exports.world.setParticles(exports.particles);
    exports.canvas = new Canvas_2.default().setSize(Constants_5.TILE * Constants_5.TILES, Constants_5.TILE * Constants_5.TILES).appendTo(document.body);
    function setCanvasSize() {
        const realSize = Constants_5.TILES * Constants_5.TILE;
        const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / realSize) * realSize;
        exports.canvas.setDisplaySize(size, size);
        exports.canvas.invalidateOffset();
    }
    setCanvasSize();
    setTimeout(setCanvasSize, 200);
    window.addEventListener("resize", setCanvasSize);
    exports.ui = new Ui_1.Ui(exports.stats);
    exports.mouse = new Mouse_1.Mouse()
        .setWorld(exports.world)
        .setView(exports.view)
        .setCanvas(exports.canvas)
        .setUi(exports.ui);
    ////////////////////////////////////
    // Render & Update
    // It's a jam game, don't complain
    //
    function update() {
        requestAnimationFrame(update);
        exports.stats.update();
        exports.mouse.update();
        exports.world.update();
        exports.particles.update();
        exports.view.update(exports.world, exports.stats, exports.mouse);
        render();
    }
    function render() {
        exports.canvas.clear();
        exports.view.render(exports.world, exports.canvas);
        exports.particles.render(exports.canvas, exports.view);
        exports.ui.render(exports.canvas);
    }
    update();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9Db25zdGFudHMudHMiLCIuLi90cy9nYW1lL1N0YXRzLnRzIiwiLi4vdHMvdXRpbC9NYXRocy50cyIsIi4uL3RzL3V0aWwvUmFuZG9tLnRzIiwiLi4vdHMvdWkvQ2FudmFzLnRzIiwiLi4vdHMvdWkvU3ByaXRlLnRzIiwiLi4vdHMvdXRpbC9EaXJlY3Rpb24udHMiLCIuLi90cy91dGlsL0VudW1zLnRzIiwiLi4vdHMvdXRpbC9Tb3VuZC50cyIsIi4uL3RzL2dhbWUvVGlsZS50cyIsIi4uL3RzL3V0aWwvQ29sb3IudHMiLCIuLi90cy91aS9UZXh0LnRzIiwiLi4vdHMvdWkvTXV0YWJsZVRleHQudHMiLCIuLi90cy91aS9VaS50cyIsIi4uL3RzL3VpL01vdXNlLnRzIiwiLi4vdHMvdWkvVmlldy50cyIsIi4uL3RzL3VpL1BhcnRpY2xlcy50cyIsIi4uL3RzL2dhbWUvV29ybGQudHMiLCIuLi90cy9kaWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQUFhLFFBQUEsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFFBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLFFBQUEsYUFBYSxHQUFHLEVBQUUsQ0FBQzs7Ozs7O0lDRmhDLElBQVksU0FJWDtJQUpELFdBQVksU0FBUztRQUNwQiwrQ0FBTyxDQUFBO1FBQ1AsNkNBQU0sQ0FBQTtRQUNOLHFEQUFVLENBQUE7SUFDWCxDQUFDLEVBSlcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFJcEI7SUFFWSxRQUFBLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFBLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFFL0IsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUM7SUFFMUMsTUFBYSxLQUFLO1FBdUJqQjs7WUFkTyxXQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFBLFlBQVksQ0FBQyxPQUFPLENBQUMsd0JB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QVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzVFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDNUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUMxRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzlFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUM7SUFFRixNQUFNLHdCQUF3QixHQUFvQztRQUNqRSxDQUFDLEVBQUUsQ0FBQztRQUNK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
define("Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GameState = exports.SURFACE_TILES = exports.TILE = exports.TILES = void 0;
    exports.TILES = 18;
    exports.TILE = 16;
    exports.SURFACE_TILES = 20;
    var GameState;
    (function (GameState) {
        GameState[GameState["Surface"] = 0] = "Surface";
        GameState[GameState["Mining"] = 1] = "Mining";
        GameState[GameState["FellBehind"] = 2] = "FellBehind";
    })(GameState = exports.GameState || (exports.GameState = {}));
});
define("ui/Canvas", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Canvas {
        constructor() {
            this.element = document.createElement("canvas");
            this.context = this.element.getContext("2d");
            this.context.imageSmoothingEnabled = false;
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
define("ui/View", ["require", "exports", "Constants", "ui/Sprite"], function (require, exports, Constants_1, Sprite_1) {
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
            return Math.floor(this.y / Constants_1.TILE);
        }
        getTopAccessibleRowY() {
            return Math.ceil(this.y / Constants_1.TILE);
        }
        getBottomVisibleRowY() {
            return Math.ceil((this.y + Constants_1.TILES * Constants_1.TILE) / Constants_1.TILE);
        }
        update(world, stats, mouse) {
            this.step++;
            if (stats.state === Constants_1.GameState.FellBehind) {
                if (this.step < -300 + 32 && this.step % 2)
                    this.y++;
                if (this.step > 0 && this.step % 2 && this.y > 0)
                    this.y--;
                return;
            }
            if (stats.state === Constants_1.GameState.Surface) {
                this.y = 0;
                return;
            }
            const bottomRow = this.getBottomVisibleRowY();
            if (this.step > 0 && (stats.dug > this.y / Constants_1.TILE || world.hasMineshaft(bottomRow - VIEW_PADDING_TILES)))
                this.step = -32;
            if (this.step < 0 && this.step % 2 === 0) {
                if (this.y % 16 === 0) {
                    stats.passTurn();
                    stats.score += 10;
                }
                this.y++;
                mouse.updatePosition();
                world.generateFor(bottomRow + 1);
            }
            let hasMineshaft = false;
            let hasMineable = false;
            for (let y = this.getTopAccessibleRowY(); y < bottomRow + 2; y++) {
                if (world.hasMineshaft(y))
                    hasMineshaft = true;
                if (world.hasMineable(y))
                    hasMineable = true;
                if (hasMineshaft && hasMineable)
                    break;
            }
            if ((!hasMineshaft || !hasMineable) && stats.state === Constants_1.GameState.Mining) {
                stats.endGame();
                this.step = -300;
            }
        }
        render(world, canvas) {
            const topY = this.getTopVisibleRowY();
            const bottomY = this.getBottomVisibleRowY();
            for (let y = topY; y <= bottomY; y++) {
                for (let x = 0; x < Constants_1.TILES; x++) {
                    const tile = world.getTile(x, y);
                    tile === null || tile === void 0 ? void 0 : tile.render(canvas, x * Constants_1.TILE, y * Constants_1.TILE - this.y);
                }
            }
            canvas.context.globalCompositeOperation = "destination-over";
            Sprite_1.default.get("background/surface").render(canvas, 0, -this.y);
            canvas.context.globalCompositeOperation = "source-over";
        }
    }
    exports.View = View;
});
define("ui/Particles", ["require", "exports", "util/Maths", "util/Random"], function (require, exports, Maths_1, Random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Particles = void 0;
    class Particles {
        constructor() {
            this.particles = [];
        }
        create(sprite, x, y, count, speedMultiplier = 1) {
            for (let i = 0; i < count; i++) {
                const [xv, yv] = Maths_1.default.direction(Random_1.default.float(Math.PI * 2), Random_1.default.float(2, 4) * speedMultiplier);
                this.particles.push({
                    sprite,
                    x, y,
                    xv, yv,
                    xo: Random_1.default.float(0.75), yo: Random_1.default.float(0.75),
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
                particle.sprite.render(canvas, Math.floor(particle.x), Math.floor(particle.y) - view.y, Math.floor(particle.sprite.width * particle.xo), Math.floor(particle.sprite.height * particle.yo), particle.sprite.width / 4, particle.sprite.height / 4);
        }
    }
    exports.Particles = Particles;
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
define("game/World", ["require", "exports", "Constants", "util/Direction", "util/Maths", "util/Random", "game/Tile"], function (require, exports, Constants_2, Direction_1, Maths_2, Random_2, Tile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const BLANK_ROWS = Constants_2.TILES - 1;
    class World {
        constructor(stats) {
            this.stats = stats;
            this.tiles = [];
            this.mineshaft = [];
            this.mineable = [];
            this.generateNewWorld();
        }
        setParticles(particles) {
            this.particles = particles;
        }
        setTile(x, y, type) {
            this.invalidateAdjacentTiles(x, y);
            if (type === Tile_1.TileType.Mineshaft)
                this.setHasMineshaft(y);
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
            if (x < 0 || x >= Constants_2.TILES)
                return null;
            return (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a[x];
        }
        getTileInDirection(direction, context, y) {
            return this.getTile(...Direction_1.Directions.move(typeof context === "number" ? context : context.x, typeof context === "number" ? y : context.y, direction));
        }
        setHasMineshaft(y) {
            this.mineshaft[y] = true;
            this.stats.mineshaftDepth = Math.max(this.stats.mineshaftDepth, y);
        }
        setIsMineable(y) {
            this.mineable[y] = true;
        }
        hasMineshaft(y) {
            var _a, _b;
            let mineshaft = this.mineshaft[y];
            if (mineshaft === undefined) {
                mineshaft = this.mineshaft[y] = (_b = (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a.some(tile => tile.type === Tile_1.TileType.Mineshaft)) !== null && _b !== void 0 ? _b : false;
                if (mineshaft)
                    this.stats.mineshaftDepth = Math.max(this.stats.mineshaftDepth, y);
            }
            return mineshaft;
        }
        hasMineable(y) {
            var _a, _b;
            let mineable = this.mineable[y];
            if (mineable === undefined)
                mineable = this.mineable[y] = (_b = (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a.some(tile => tile.isMineable())) !== null && _b !== void 0 ? _b : false;
            return mineable;
        }
        generateFor(y) {
            while (this.tiles.length < y)
                this.generateRows();
        }
        generateRow(tileType) {
            const y = this.tiles.length;
            const row = [];
            this.tiles.push(row);
            for (let x = 0; x < Constants_2.TILES; x++)
                this.setTile(x, y, tileType);
        }
        generateRows(rows = Random_2.default.int(5, 20)) {
            for (let i = 0; i < rows; i++)
                this.generateRow(Tile_1.TileType.Rock);
            const below = this.tiles.length - rows;
            while (Random_2.default.chance(Maths_2.default.lerp(0.4, 0.6, this.stats.difficulty)))
                this.generateMetalRemains(below);
            while (Random_2.default.chance(Maths_2.default.lerp(0.6, 0.3, this.stats.difficulty)))
                this.generateCave(below);
            while (Random_2.default.chance(0.8)) {
                const size = Random_2.default.int(1, 4);
                let x = Random_2.default.int(0, Constants_2.TILES);
                let y = Random_2.default.int(this.tiles.length - rows, this.tiles.length);
                this.generateVeinAt(Tile_1.TileType.Gold, size, x, y, Tile_1.TileType.Rock);
            }
            if (Random_2.default.chance(0.1)) {
                const size = Random_2.default.int(1, 3);
                let x = Random_2.default.int(0, Constants_2.TILES);
                let y = Random_2.default.int(this.tiles.length - rows, this.tiles.length);
                this.generateVeinAt(Tile_1.TileType.Emerald, size, x, y, Tile_1.TileType.Rock);
            }
            // clean up old tiles
            // while (this.tiles.length - this.first > TILES * 2)
            // 	delete this.tiles[this.first++];
            // increment this.first
            while (this.tiles.length - this.first++ > Constants_2.TILES * 2)
                ;
        }
        update() {
            if (this.stats.state === Constants_2.GameState.Surface && this.tiles.length > BLANK_ROWS + 4) {
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
            for (const direction of Direction_1.Directions.CARDINALS)
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
            this.generateVeinBelow(Tile_1.TileType.Cavern, Random_2.default.int(10, 30), below, Tile_1.TileType.Rock);
        }
        generateVeinBelow(type, size, below, replace) {
            this.generateVeinAt(type, size, Random_2.default.int(Constants_2.TILES), Random_2.default.int(below, this.tiles.length), replace);
        }
        generateVeinAt(type, size, x, y, replace) {
            var _a;
            for (let i = 0; i < size; i++) {
                if (replace === undefined || ((_a = this.getTile(x, y)) === null || _a === void 0 ? void 0 : _a.type) === replace)
                    this.setTile(x, y, type);
                [x, y] = Direction_1.Directions.move(x, y, Random_2.default.choice(...Direction_1.Directions.CARDINALS));
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
                width: Random_2.default.int(4, Maths_2.default.lerp(6, 12, this.stats.difficulty)),
                height: Random_2.default.int(4, 6),
            });
        }
        generateStructure(below, options) {
            if (options.border === undefined && options.inside === undefined)
                return; // nothing to generate
            const maxY = this.tiles.length - options.height;
            if (maxY <= below)
                return;
            let x = Random_2.default.int(Constants_2.TILES);
            let y = Random_2.default.int(below, maxY);
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
                if (Random_2.default.chance((_b = decay === null || decay === void 0 ? void 0 : decay.chance) !== null && _b !== void 0 ? _b : 0))
                    return this.resolveGenerationOptions(decay);
            return options.type;
        }
    }
    exports.default = World;
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
define("ui/Text", ["require", "exports", "util/Color", "util/Enums", "ui/Canvas", "ui/Sprite"], function (require, exports, Color_1, Enums_1, Canvas_1, Sprite_2) {
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
        FontSprite[FontSprite["Plus"] = 9] = "Plus";
        FontSprite[FontSprite["Minus"] = 10] = "Minus";
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
        [FontSprite.Plus]: "+".charCodeAt(0),
        [FontSprite.Minus]: "-".charCodeAt(0),
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
        "+": 5,
        "-": 5,
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
            for (const fontSprite of Enums_1.default.values(FontSprite)) {
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
define("ui/Ui", ["require", "exports", "Constants", "game/Stats", "ui/MutableText", "ui/Text"], function (require, exports, Constants_3, Stats_1, MutableText_1, Text_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ui = void 0;
    class Ui {
        constructor(stats) {
            this.stats = stats;
            this.score = new MutableText_1.MutableText(() => [
                ...this.stats.state === Constants_3.GameState.Surface ? [
                    ...!this.stats.highscore ? [] : [`Highest stock value: $${this.stats.highscore}`],
                ] : [
                    `Depth: ${this.stats.turn}${!this.stats.scheduledDepthDifference ? ""
                        : ` (${this.stats.scheduledDepthDifference > 0 ? "+" : ""}${this.stats.scheduledDepthDifference})`}`,
                    ...this.stats.turn * 10 === this.stats.score ? [] : [`Stock value: $${this.stats.score}`],
                ],
            ].join("\n"));
            this.abilities = new MutableText_1.MutableText(() => [
                "ABILITIES: Right Click ",
                ...!this.stats.discoveredAssays ? []
                    : [`Assay cost: $${this.stats.assayCost}`],
                ...this.stats.explosives === Stats_1.NOT_DISCOVERED ? []
                    : [`Explosives: Have ${this.stats.explosives}`],
            ].join("\n"))
                .setAlign(Text_2.Align.Right);
            this.title = new MutableText_1.MutableText(() => this.stats.state === Constants_3.GameState.Surface ? "DIG DIG DIG"
                : "GAME OVER!")
                .setScale(4);
            this.author = new MutableText_1.MutableText(() => "by Chirichirichiri")
                .setScale(2);
            this.hint = new MutableText_1.MutableText(() => this.stats.state === Constants_3.GameState.Surface ? "Use the mouse to start mining!"
                : "Click anywhere to play again!");
        }
        render(canvas) {
            var _a, _b, _c, _d, _e;
            let width;
            let height;
            if (this.stats.state !== Constants_3.GameState.Mining) {
                [width, height] = (_a = this.title.getLayout()) !== null && _a !== void 0 ? _a : [0, 0];
                this.title.render(canvas, canvas.width / 2 - width / 2, canvas.height / 4 - height / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10));
            }
            if (this.stats.state === Constants_3.GameState.Surface) {
                const titleXEnd = canvas.width / 2 + width / 2;
                const titleYEnd = canvas.height / 4 + height / 2;
                [width, height] = (_b = this.author.getLayout()) !== null && _b !== void 0 ? _b : [0, 0];
                this.author.render(canvas, titleXEnd - width, titleYEnd + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10));
            }
            if (this.stats.state !== Constants_3.GameState.Mining) {
                [width, height] = (_c = this.hint.getLayout()) !== null && _c !== void 0 ? _c : [0, 0];
                this.hint.render(canvas, canvas.width - width - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3), canvas.height - height - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5));
            }
            [width, height] = (_d = this.score.getLayout()) !== null && _d !== void 0 ? _d : [0, 0];
            this.score.render(canvas, 5, canvas.height - height - 2);
            if (this.stats.state === Constants_3.GameState.Mining && (this.stats.explosives !== Stats_1.NOT_DISCOVERED || this.stats.discoveredAssays)) {
                [width, height] = (_e = this.abilities.getLayout()) !== null && _e !== void 0 ? _e : [0, 0];
                this.abilities.render(canvas, canvas.width - width + 1, canvas.height - height - 2);
            }
        }
        onMouseDown() {
            if (this.stats.state === Constants_3.GameState.FellBehind)
                this.stats.reset();
        }
    }
    exports.Ui = Ui;
});
define("ui/Mouse", ["require", "exports", "Constants"], function (require, exports, Constants_4) {
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
            const size = Constants_4.TILES * Constants_4.TILE;
            x *= size / canvasSize.x;
            y *= size / canvasSize.y;
            if (this.world.stats.state === Constants_4.GameState.FellBehind)
                return undefined;
            return this.calculateTileTarget(x, y);
        }
        calculateTileTarget(x, y) {
            y += this.view.y;
            x = Math.floor(x / Constants_4.TILE);
            y = Math.floor(y / Constants_4.TILE);
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
define("util/Sound", ["require", "exports", "util/Enums", "util/Random"], function (require, exports, Enums_2, Random_3) {
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
            for (const sound of Enums_2.default.values(SoundType)) {
                for (let i = 0; i < versionCount[sound]; i++) {
                    Sound.get(sound, i);
                }
            }
        }
        static get(type, which = type === undefined ? 0 : Random_3.default.int(versionCount[type])) {
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
define("game/Tile", ["require", "exports", "Constants", "ui/Sprite", "util/Direction", "util/Random", "util/Sound"], function (require, exports, Constants_5, Sprite_3, Direction_2, Random_4, Sound_1) {
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
        const range = Random_4.default.int(4, Random_4.default.int(5, Random_4.default.int(6, 9))); // use multiple calls to weight smaller explosions higher
        tile.context.world.particles.create(Sprite_3.default.get("explosion"), tile.context.x * Constants_5.TILE + Constants_5.TILE / 2, tile.context.y * Constants_5.TILE + Constants_5.TILE / 2, 128, range / 2);
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
            this.durability = Random_4.default.int(2, 4);
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
            this.mask = Direction_2.default.None;
            if (!getProperty(this.type, "mask"))
                return;
            for (const direction of Direction_2.Directions.CARDINALS) {
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
            const tiles = Direction_2.Directions.CARDINALS
                .map(direction => this.context.world.getTileInDirection(direction, this.context));
            const maxLightLevel = Math.max(...tiles.map(tile => { var _a, _b; return tile ? (_b = (_a = getProperty(tile === null || tile === void 0 ? void 0 : tile.type, "light")) !== null && _a !== void 0 ? _a : tile === null || tile === void 0 ? void 0 : tile.light) !== null && _b !== void 0 ? _b : 0 : 0; }));
            this.light = maxLightLevel - 1;
            for (const tile of tiles)
                if (tile && ((_a = tile.light) !== null && _a !== void 0 ? _a : 0) < this.light - 1)
                    tile.invalidate();
            delete this.recalcLightTick;
            if (this.isMineable())
                this.context.world.setIsMineable(this.context.y);
        }
        static getSprite(type) {
            const description = tiles[type];
            const category = description.category === undefined ? "" : `/${TileCategory[description.category].toLowerCase()}`;
            return Sprite_3.default.get(`tile${category}/${TileType[type].toLowerCase()}`);
        }
        static render(tile, type, canvas, x, y, light, mask) {
            var _a;
            const description = tiles[type];
            if ((light !== null && light !== void 0 ? light : Infinity) <= 0 && (tile.context.world.stats.state === Constants_5.GameState.FellBehind || tile.revealed))
                light = 1;
            if (description.invisible && description.background === undefined || (light !== undefined && light <= 0))
                return;
            if (!description.invisible) {
                if (description.base !== undefined)
                    Tile.render(tile, description.base, canvas, x, y, undefined, mask);
                Tile.getSprite(type).render(canvas, x, y);
                if (mask && description.mask) {
                    const maskSprite = Sprite_3.default.get(`tile/mask/${description.mask}`);
                    canvas.context.globalCompositeOperation = "destination-out";
                    if (mask & Direction_2.default.North)
                        maskSprite.render(canvas, x, y, 0, 0, Constants_5.TILE, Constants_5.TILE);
                    if (mask & Direction_2.default.East)
                        maskSprite.render(canvas, x, y, Constants_5.TILE, 0, Constants_5.TILE, Constants_5.TILE);
                    if (mask & Direction_2.default.South)
                        maskSprite.render(canvas, x, y, Constants_5.TILE, Constants_5.TILE, Constants_5.TILE, Constants_5.TILE);
                    if (mask & Direction_2.default.West)
                        maskSprite.render(canvas, x, y, 0, Constants_5.TILE, Constants_5.TILE, Constants_5.TILE);
                }
            }
            canvas.context.globalCompositeOperation = "destination-over";
            if (description.background !== undefined && ((_a = tile === null || tile === void 0 ? void 0 : tile.context.y) !== null && _a !== void 0 ? _a : 0) >= Constants_5.SURFACE_TILES && (description.mask ? mask : true))
                Sprite_3.default.get(`tile/background/${TileType[description.background].toLowerCase()}`).render(canvas, x, y);
            canvas.context.globalCompositeOperation = "source-over";
            if (light !== undefined && light < LIGHT_MAX) {
                canvas.context.fillStyle = `rgba(0,0,0,${1 - Math.min(1, Math.max(0, light / LIGHT_MAX))})`;
                canvas.context.fillRect(x, y, Constants_5.TILE, Constants_5.TILE);
            }
        }
        render(canvas, x, y) {
            Tile.render(this, this.type, canvas, x, y, this.getLight(), this.getMask());
            if (this.breakAnim)
                Sprite_3.default.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);
            if (this.hovering && this.isAccessible())
                Sprite_3.default.get("ui/hover").render(canvas, x, y);
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
                if (DamageType.Mining >= getProperty(this.type, "breakable", DamageType.Invulnerable))
                    this.breakAnim += amount;
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
                this.context.world.stats.dig(this.type);
            if (effects) {
                Sound_1.default.get((_b = getProperty(this.type, "breakSound")) !== null && _b !== void 0 ? _b : Sound_1.SoundType.Break).play();
                this.particles(16);
            }
        }
        particles(amount) {
            this.context.world.particles.create(Tile.getSprite(this.type), this.context.x * Constants_5.TILE + Constants_5.TILE / 2, this.context.y * Constants_5.TILE + Constants_5.TILE / 2, amount);
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
define("game/Stats", ["require", "exports", "Constants", "game/Tile"], function (require, exports, Constants_6, Tile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stats = exports.COST_ASSAY = exports.NOT_DISCOVERED = void 0;
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
        get scheduledDepthDifference() {
            if (this.turn < 50)
                return 0;
            const difference = this.turn - this.dug;
            if (difference > 0)
                return difference;
            return this.mineshaftDepth - this.turn - Constants_6.TILES + 7;
        }
        reset() {
            this.dug = 0;
            this.turn = 0;
            this.tick = 0;
            this.exhaustion = 0;
            this.score = 0;
            this.state = Constants_6.GameState.Surface;
            this.explosives = exports.NOT_DISCOVERED;
            this.discoveredAssays = false;
            this.mineshaftDepth = 0;
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
            this.state = Constants_6.GameState.Mining;
        }
        dig(tileType) {
            if (tileType === Tile_2.TileType.Rock)
                this.dug++;
            this.state = Constants_6.GameState.Mining;
        }
        addExplosive() {
            if (this.explosives === exports.NOT_DISCOVERED)
                this.explosives = 0;
            this.explosives++;
        }
        endGame() {
            this.state = Constants_6.GameState.FellBehind;
            this.scores.push(this.score);
            localStorage.setItem(LOCAL_STORAGE_KEY_SCORES, JSON.stringify(this.scores));
        }
    }
    exports.Stats = Stats;
});
define("dig", ["require", "exports", "Constants", "game/Stats", "game/World", "ui/Canvas", "ui/Mouse", "ui/Particles", "ui/Ui", "ui/View", "util/Sound"], function (require, exports, Constants_7, Stats_2, World_1, Canvas_2, Mouse_1, Particles_1, Ui_1, View_1, Sound_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mouse = exports.ui = exports.canvas = exports.particles = exports.view = exports.world = exports.stats = void 0;
    ////////////////////////////////////
    // Game
    //
    exports.stats = new Stats_2.Stats();
    exports.world = new World_1.default(exports.stats);
    exports.view = new View_1.View();
    ////////////////////////////////////
    // UI
    //
    Sound_2.default.preload();
    exports.particles = new Particles_1.Particles();
    exports.world.setParticles(exports.particles);
    exports.canvas = new Canvas_2.default().setSize(Constants_7.TILE * Constants_7.TILES, Constants_7.TILE * Constants_7.TILES).appendTo(document.body);
    function setCanvasSize() {
        const realSize = Constants_7.TILES * Constants_7.TILE;
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
    //
    const updateInterval = Math.floor(1000 / 60);
    function update() {
        exports.stats.update();
        exports.mouse.update();
        exports.world.update();
        exports.particles.update();
        exports.view.update(exports.world, exports.stats, exports.mouse);
    }
    let lastFrame = 0;
    function render() {
        requestAnimationFrame(render);
        const now = Date.now();
        const elapsed = now - lastFrame;
        if (elapsed < updateInterval)
            return;
        lastFrame = now - (elapsed % updateInterval);
        update();
        exports.canvas.clear();
        exports.view.render(exports.world, exports.canvas);
        exports.particles.render(exports.canvas, exports.view);
        exports.ui.render(exports.canvas);
    }
    render();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9Db25zdGFudHMudHMiLCIuLi90cy91aS9DYW52YXMudHMiLCIuLi90cy91dGlsL01hdGhzLnRzIiwiLi4vdHMvdXRpbC9SYW5kb20udHMiLCIuLi90cy91aS9TcHJpdGUudHMiLCIuLi90cy91aS9WaWV3LnRzIiwiLi4vdHMvdWkvUGFydGljbGVzLnRzIiwiLi4vdHMvdXRpbC9EaXJlY3Rpb24udHMiLCIuLi90cy9nYW1lL1dvcmxkLnRzIiwiLi4vdHMvdXRpbC9Db2xvci50cyIsIi4uL3RzL3V0aWwvRW51bXMudHMiLCIuLi90cy91aS9UZXh0LnRzIiwiLi4vdHMvdWkvTXV0YWJsZVRleHQudHMiLCIuLi90cy91aS9VaS50cyIsIi4uL3RzL3VpL01vdXNlLnRzIiwiLi4vdHMvdXRpbC9Tb3VuZC50cyIsIi4uL3RzL2dhbWUvVGlsZS50cyIsIi4uL3RzL2dhbWUvU3RhdHMudHMiLCIuLi90cy9kaWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQUFhLFFBQUEsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFFBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLFFBQUEsYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUVoQyxJQUFZLFNBSVg7SUFKRCxXQUFZLFNBQVM7UUFDcEIsK0NBQU8sQ0FBQTtRQUNQLDZDQUFNLENBQUE7UUFDTixxREFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUpXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBSXBCOzs7OztJQ1JELE1BQXFCLE1BQU07UUFhMUI7WUFYaUIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsWUFBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1lBV3hELElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQzVD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
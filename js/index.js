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
            if (x < 0 || x >= Constants_2.TILES)
                return null;
            return (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a[x];
        }
        getTileInDirection(direction, context, y) {
            return this.getTile(...Direction_1.Directions.move(typeof context === "number" ? context : context.x, typeof context === "number" ? y : context.y, direction));
        }
        setHasMineshaft(y) {
            this.mineshaft[y] = true;
        }
        setIsMineable(y) {
            this.mineable[y] = true;
        }
        hasMineshaft(y) {
            var _a, _b;
            let mineshaft = this.mineshaft[y];
            if (mineshaft === undefined)
                mineshaft = this.mineshaft[y] = (_b = (_a = this.tiles[y]) === null || _a === void 0 ? void 0 : _a.some(tile => tile.type === Tile_1.TileType.Mineshaft)) !== null && _b !== void 0 ? _b : false;
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
                    ...this.stats.turn * 10 === this.stats.score ? [] : [`Stock value: $${this.stats.score}`],
                    `Mined depth: ${this.stats.turn}`,
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
            if (this.stats.state === Constants_3.GameState.Mining && this.stats.explosives !== Stats_1.NOT_DISCOVERED || this.stats.discoveredAssays) {
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
        const range = Random_4.default.int(4, Random_4.default.int(5, Random_4.default.int(6, 8))); // use multiple calls to weight smaller explosions higher
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
                if (damageType === DamageType.Mining)
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
        reset() {
            this.dug = 0;
            this.turn = 0;
            this.tick = 0;
            this.exhaustion = 0;
            this.score = 0;
            this.state = Constants_6.GameState.Surface;
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
    const updateInterval = 1000 / 60;
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
        if (now - lastFrame < updateInterval)
            return;
        lastFrame = now;
        update();
        exports.canvas.clear();
        exports.view.render(exports.world, exports.canvas);
        exports.particles.render(exports.canvas, exports.view);
        exports.ui.render(exports.canvas);
    }
    render();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9Db25zdGFudHMudHMiLCIuLi90cy91aS9DYW52YXMudHMiLCIuLi90cy91dGlsL01hdGhzLnRzIiwiLi4vdHMvdXRpbC9SYW5kb20udHMiLCIuLi90cy91aS9TcHJpdGUudHMiLCIuLi90cy91aS9WaWV3LnRzIiwiLi4vdHMvdWkvUGFydGljbGVzLnRzIiwiLi4vdHMvdXRpbC9EaXJlY3Rpb24udHMiLCIuLi90cy9nYW1lL1dvcmxkLnRzIiwiLi4vdHMvdXRpbC9Db2xvci50cyIsIi4uL3RzL3V0aWwvRW51bXMudHMiLCIuLi90cy91aS9UZXh0LnRzIiwiLi4vdHMvdWkvTXV0YWJsZVRleHQudHMiLCIuLi90cy91aS9VaS50cyIsIi4uL3RzL3VpL01vdXNlLnRzIiwiLi4vdHMvdXRpbC9Tb3VuZC50cyIsIi4uL3RzL2dhbWUvVGlsZS50cyIsIi4uL3RzL2dhbWUvU3RhdHMudHMiLCIuLi90cy9kaWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQUFhLFFBQUEsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFFBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLFFBQUEsYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUVoQyxJQUFZLFNBSVg7SUFKRCxXQUFZLFNBQVM7UUFDcEIsK0NBQU8sQ0FBQTtRQUNQLDZDQUFNLENBQUE7UUFDTixxREFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUpXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBSXBCOzs7OztJQ1JELE1BQXFCLE1BQU07UUFhMUI7WUFYaUIsWUFBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsWUFBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1lBV3hELElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQzVD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UUFDWCxtREFBUSxDQUFBO0lBQ1QsQ0FBQyxFQVZJLFVBQVUsS0FBVixVQUFVLFFBVWQ7SUFTRCxNQUFNLHFCQUFxQixHQUE2QztRQUN2RSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzVFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDNUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUMxRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzlFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdB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
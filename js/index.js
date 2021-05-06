var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GameState = exports.CANVAS = exports.SURFACE_TILES = exports.TILE = exports.TILES = void 0;
    exports.TILES = 18;
    exports.TILE = 16;
    exports.SURFACE_TILES = 20;
    exports.CANVAS = exports.TILE * exports.TILES;
    var GameState;
    (function (GameState) {
        GameState[GameState["Surface"] = 0] = "Surface";
        GameState[GameState["Mining"] = 1] = "Mining";
        GameState[GameState["FellBehind"] = 2] = "FellBehind";
    })(GameState = exports.GameState || (exports.GameState = {}));
});
define("util/type", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("util/decorator/Bound", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function default_1(target, key, descriptor) {
        const fn = descriptor.value;
        return {
            configurable: true,
            get() {
                // eslint-disable-next-line no-prototype-builtins, @typescript-eslint/no-unsafe-member-access
                if (!this || this === target.prototype || this.hasOwnProperty(key) || typeof fn !== "function") {
                    return fn;
                }
                const boundFn = fn.bind(this);
                Object.defineProperty(this, key, {
                    configurable: true,
                    value: boundFn,
                });
                return boundFn;
            },
        };
    }
    exports.default = default_1;
});
define("util/Geometry", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Margin = exports.Rectangle = void 0;
    var Rectangle;
    (function (Rectangle) {
        function intersects(...[rx, ry, rw, rh, x, y, w, h]) {
            if (w === undefined || h === undefined)
                return x >= rx && x < rx + rw
                    && y >= ry && y < ry + rh;
            return x < rx + rw && x + w > rx
                && y < ry + rh && y + h > ry;
        }
        Rectangle.intersects = intersects;
    })(Rectangle = exports.Rectangle || (exports.Rectangle = {}));
    class Margin {
        constructor(top, right, bottom, left) {
            this.top = top;
            this.right = right;
            this.bottom = bottom;
            this.left = left;
        }
        static of(margin) {
            return new Margin(margin, margin, margin, margin);
        }
        setTop(top) {
            this.top = top;
            return this;
        }
        setRight(right) {
            this.right = right;
            return this;
        }
        setBottom(bottom) {
            this.bottom = bottom;
            return this;
        }
        setLeft(left) {
            this.left = left;
            return this;
        }
    }
    exports.Margin = Margin;
    Margin.ZERO = new Margin(0, 0, 0, 0);
    Margin.AUTO = new Margin();
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
define("ui/Mouse", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "util/decorator/Bound", "util/Geometry"], function (require, exports, Emitter_1, Events_1, Bound_1, Geometry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mouse = void 0;
    let Mouse = class Mouse extends (0, Emitter_1.EventHost)(Events_1.default) {
        constructor(surface) {
            super();
            this.surface = surface;
            this.held = false;
            this.point = [NaN, NaN];
            window.addEventListener("mousemove", event => this.onMove(event));
            window.addEventListener("click", event => this.onClick(event));
            window.addEventListener("mousedown", event => this.onDown(event));
            window.addEventListener("mouseup", event => this.onUp(event));
            window.addEventListener("contextmenu", event => this.onRightClick(event));
        }
        get isValid() {
            return !isNaN(this.point[0]) && !isNaN(this.point[1]);
        }
        update() {
            var _a;
            if (this.held) {
                this.event.emit("hold", ...this.point);
                (_a = this.target) === null || _a === void 0 ? void 0 : _a.event.emit("mouseHold", this);
            }
        }
        updateTarget() {
            const oldTarget = this.target;
            const target = !this.isValid ? undefined
                : this.event.query("getTarget")
                    .get(this.isTargeting);
            if (oldTarget !== target) {
                if (oldTarget) {
                    this.event.emit("leave", oldTarget);
                    oldTarget.event.emit("mouseLeave", this);
                }
                if (target) {
                    this.event.emit("enter", target);
                    target.event.emit("mouseEnter", this);
                }
                this.target = target;
                this.event.emit("changeTarget", target);
            }
        }
        updatePosition(event) {
            var _a;
            const [oldX, oldY] = this.point;
            const [x, y] = this.getPoint(event);
            if (oldX === x && oldY === y)
                return;
            this.point = [x, y];
            this.updateTarget();
            this.event.emit("move", x, y);
            (_a = this.target) === null || _a === void 0 ? void 0 : _a.event.emit("mouseMove", this);
        }
        isTargeting(target) {
            return target.surface === undefined || Geometry_1.Rectangle.intersects(...target.surface, ...this.point);
        }
        getPoint(event) {
            var _a, _b, _c, _d, _e, _f;
            let x = (_c = (_a = event === null || event === void 0 ? void 0 : event.clientX) !== null && _a !== void 0 ? _a : (_b = event === null || event === void 0 ? void 0 : event.touches) === null || _b === void 0 ? void 0 : _b[0].clientX) !== null && _c !== void 0 ? _c : NaN;
            let y = (_f = (_d = event === null || event === void 0 ? void 0 : event.clientY) !== null && _d !== void 0 ? _d : (_e = event === null || event === void 0 ? void 0 : event.touches) === null || _e === void 0 ? void 0 : _e[0].clientY) !== null && _f !== void 0 ? _f : NaN;
            if (this.surface && !isNaN(x) && !isNaN(y)) {
                const canvasOffset = this.surface.getOffset();
                x -= canvasOffset.x;
                y -= canvasOffset.y;
                const canvasSize = this.surface.getDisplaySize();
                if (x >= 0 || x < canvasSize.x || y >= 0 || y < canvasSize.y) {
                    x *= this.surface.width / canvasSize.x;
                    y *= this.surface.height / canvasSize.y;
                }
                else {
                    x = NaN;
                    y = NaN;
                }
            }
            else {
                x = NaN;
                y = NaN;
            }
            return [x, y];
        }
        onMove(event) {
            this.updatePosition(event);
        }
        onClick(event) {
            var _a;
            this.updatePosition(event);
            this.event.emit("click", ...this.point);
            (_a = this.target) === null || _a === void 0 ? void 0 : _a.event.emit("mouseClick", this);
        }
        onRightClick(event) {
            var _a, _b;
            if (event.target.tagName === "CANVAS")
                (_a = event.preventDefault) === null || _a === void 0 ? void 0 : _a.call(event);
            this.updatePosition(event);
            this.event.emit("rightClick", ...this.point);
            (_b = this.target) === null || _b === void 0 ? void 0 : _b.event.emit("mouseRightClick", this);
        }
        onDown(event) {
            var _a, _b;
            if (event.button === 2)
                return;
            this.updatePosition(event);
            this.held = true;
            this.event.emit("down", ...this.point);
            (_a = this.target) === null || _a === void 0 ? void 0 : _a.event.emit("mouseDown", this);
            this.event.emit("hold", ...this.point);
            (_b = this.target) === null || _b === void 0 ? void 0 : _b.event.emit("mouseHold", this);
        }
        onUp(event) {
            var _a;
            this.updatePosition(event);
            this.event.emit("up", ...this.point);
            (_a = this.target) === null || _a === void 0 ? void 0 : _a.event.emit("mouseUp", this);
            this.held = false;
        }
    };
    __decorate([
        Bound_1.default
    ], Mouse.prototype, "isTargeting", null);
    Mouse = __decorate([
        Events_1.default.Bus(Events_1.EventBus.Mouse)
    ], Mouse);
    exports.Mouse = Mouse;
});
define("ui/Cursor", ["require", "exports", "Events"], function (require, exports, Events_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cursor = void 0;
    var Cursor;
    (function (Cursor) {
        Cursor[Cursor["Default"] = 0] = "Default";
        Cursor[Cursor["Pointer"] = 1] = "Pointer";
        Cursor[Cursor["Grab"] = 2] = "Grab";
        Cursor[Cursor["Grabbing"] = 3] = "Grabbing";
        Cursor[Cursor["Grab-Ignite"] = 4] = "Grab-Ignite";
        Cursor[Cursor["Mine"] = 5] = "Mine";
        Cursor[Cursor["Assay"] = 6] = "Assay";
    })(Cursor = exports.Cursor || (exports.Cursor = {}));
    let CursorHandler = class CursorHandler {
        onChangeTarget(api, target) {
            var _a;
            const cursor = (_a = target) === null || _a === void 0 ? void 0 : _a.cursor;
            if (this.cursor === cursor)
                return;
            if (this.cursor !== undefined)
                document.body.classList.remove(`cursor-${Cursor[this.cursor].toLowerCase()}`);
            this.cursor = cursor;
            if (cursor !== undefined)
                document.body.classList.add(`cursor-${Cursor[cursor].toLowerCase()}`);
        }
    };
    __decorate([
        Events_2.default.Handler(Events_2.EventBus.Mouse, "changeTarget")
    ], CursorHandler.prototype, "onChangeTarget", null);
    CursorHandler = __decorate([
        Events_2.default.Subscribe
    ], CursorHandler);
    exports.default = CursorHandler;
});
define("util/prototype/Function", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function default_2() {
        Object.defineProperty(Function.prototype, "debounce", {
            value(time) {
                if (this.timeout !== undefined)
                    clearTimeout(this.timeout);
                this.timeout = setTimeout(this, time);
            },
        });
    }
    exports.default = default_2;
});
define("util/Strings", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Strings;
    (function (Strings) {
        function capitalise(str) {
            return `${str[0].toUpperCase()}${str.slice(1)}`;
        }
        Strings.capitalise = capitalise;
    })(Strings || (Strings = {}));
    exports.default = Strings;
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
define("ui/View", ["require", "exports", "Events", "Constants", "ui/Sprite"], function (require, exports, Events_3, Constants_1, Sprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    const VIEW_PADDING_TILES = 6;
    let View = class View {
        constructor(world, mouse) {
            this.world = world;
            this.mouse = mouse;
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
            return Math.ceil((this.y + Constants_1.CANVAS) / Constants_1.TILE);
        }
        update(stats) {
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
            if (this.step > 0 && (stats.dug > this.y / Constants_1.TILE || this.world.hasMineshaft(bottomRow - VIEW_PADDING_TILES)))
                this.step = -32;
            if (this.step < 0 && this.step % 2 === 0) {
                if (this.y % 16 === 0) {
                    stats.passTurn();
                    stats.score += 10;
                }
                this.y++;
                this.mouse.updateTarget();
                this.world.generateFor(bottomRow + 1);
            }
            let hasMineshaft = false;
            let hasMineable = false;
            for (let y = this.getTopAccessibleRowY(); y < bottomRow + 2; y++) {
                if (this.world.hasMineshaft(y))
                    hasMineshaft = true;
                if (this.world.hasMineable(y))
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
        getTarget(api) {
            var _a;
            if (this.world.stats.state === Constants_1.GameState.FellBehind)
                return undefined;
            let [x, y] = api.host.point;
            y += this.y;
            x = Math.floor(x / Constants_1.TILE);
            y = Math.floor(y / Constants_1.TILE);
            return (_a = this.world.getTile(x, y)) !== null && _a !== void 0 ? _a : undefined;
        }
        onTileChange(api, x, y, tile, oldTile) {
            if (oldTile === this.mouse.target)
                this.mouse.updateTarget();
        }
    };
    __decorate([
        Events_3.default.Handler(Events_3.EventBus.Mouse, "getTarget")
    ], View.prototype, "getTarget", null);
    __decorate([
        Events_3.default.Handler(Events_3.EventBus.World, "change")
    ], View.prototype, "onTileChange", null);
    View = __decorate([
        Events_3.default.Subscribe,
        Events_3.default.Bus(Events_3.EventBus.View)
    ], View);
    exports.View = View;
});
define("ui/Particles", ["require", "exports", "util/Maths", "util/Random"], function (require, exports, Maths_1, Random_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Particles = void 0;
    class Particles {
        constructor() {
            this.particles = [];
        }
        create(sprite, x, y, count, speedMultiplier = 1) {
            for (let i = 0; i < count; i++) {
                const [xv, yv] = Maths_1.default.direction(Random_2.default.float(Math.PI * 2), Random_2.default.float(2, 4) * speedMultiplier);
                this.particles.push({
                    sprite,
                    x, y,
                    xv, yv,
                    xo: Random_2.default.float(0.75), yo: Random_2.default.float(0.75),
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
define("game/World", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "Constants", "util/Direction", "util/Maths", "util/Random", "game/Tile"], function (require, exports, Emitter_2, Events_4, Constants_2, Direction_1, Maths_2, Random_3, Tile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const BLANK_ROWS = Constants_2.TILES - 1;
    let World = class World extends (0, Emitter_2.EventHost)(Events_4.default) {
        constructor(stats) {
            super();
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
            const oldTile = this.tiles[y][x];
            const tile = this.tiles[y][x] = new Tile_1.default(type, this, x, y);
            this.event.emit("change", x, y, tile, oldTile);
            return tile;
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
        generateRows(rows = Random_3.default.int(5, 20)) {
            for (let i = 0; i < rows; i++)
                this.generateRow(Tile_1.TileType.Rock);
            const below = this.tiles.length - rows;
            while (Random_3.default.chance(Maths_2.default.lerp(0.4, 0.6, this.stats.difficulty)))
                this.generateMetalRemains(below);
            while (Random_3.default.chance(Maths_2.default.lerp(0.6, 0.3, this.stats.difficulty)))
                this.generateCave(below);
            while (Random_3.default.chance(0.8)) {
                const size = Random_3.default.int(1, 4);
                let x = Random_3.default.int(0, Constants_2.TILES);
                let y = Random_3.default.int(this.tiles.length - rows, this.tiles.length);
                this.generateVeinAt(Tile_1.TileType.Gold, size, x, y, Tile_1.TileType.Rock);
            }
            if (Random_3.default.chance(0.1)) {
                const size = Random_3.default.int(1, 3);
                let x = Random_3.default.int(0, Constants_2.TILES);
                let y = Random_3.default.int(this.tiles.length - rows, this.tiles.length);
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
            this.generateVeinBelow(Tile_1.TileType.Cavern, Random_3.default.int(10, 30), below, Tile_1.TileType.Rock);
        }
        generateVeinBelow(type, size, below, replace) {
            this.generateVeinAt(type, size, Random_3.default.int(Constants_2.TILES), Random_3.default.int(below, this.tiles.length), replace);
        }
        generateVeinAt(type, size, x, y, replace) {
            var _a;
            for (let i = 0; i < size; i++) {
                if (replace === undefined || ((_a = this.getTile(x, y)) === null || _a === void 0 ? void 0 : _a.type) === replace)
                    this.setTile(x, y, type);
                [x, y] = Direction_1.Directions.move(x, y, Random_3.default.choice(...Direction_1.Directions.CARDINALS));
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
                width: Random_3.default.int(4, Maths_2.default.lerp(6, 12, this.stats.difficulty)),
                height: Random_3.default.int(4, 6),
            });
        }
        generateStructure(below, options) {
            if (options.border === undefined && options.inside === undefined)
                return; // nothing to generate
            const maxY = this.tiles.length - options.height;
            if (maxY <= below)
                return;
            let x = Random_3.default.int(Constants_2.TILES);
            let y = Random_3.default.int(below, maxY);
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
                if (Random_3.default.chance((_b = decay === null || decay === void 0 ? void 0 : decay.chance) !== null && _b !== void 0 ? _b : 0))
                    return this.resolveGenerationOptions(decay);
            return options.type;
        }
    };
    World = __decorate([
        Events_4.default.Bus(Events_4.EventBus.World)
    ], World);
    exports.default = World;
});
define("game/Tile", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "ui/Cursor", "util/Strings", "Constants", "ui/Sprite", "util/Direction", "util/Random", "util/Sound"], function (require, exports, Emitter_3, Events_5, Cursor_1, Strings_1, Constants_3, Sprite_2, Direction_2, Random_4, Sound_1) {
    "use strict";
    var Tile_2;
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
            cursor: Cursor_1.Cursor["Grab-Ignite"],
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
        tile.context.world.particles.create(Sprite_2.default.get("explosion"), tile.context.x * Constants_3.TILE + Constants_3.TILE / 2, tile.context.y * Constants_3.TILE + Constants_3.TILE / 2, 128, range / 2);
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
    let Tile = Tile_2 = class Tile extends (0, Emitter_3.EventHost)(Events_5.default) {
        constructor(type, world, x, y) {
            super();
            this.type = type;
            this.hovering = false;
            this.durability = Random_4.default.int(2, 4);
            this.breakAnim = 0;
            this.recalcLightTick = -1;
            this.context = { world, x, y };
        }
        get cursor() {
            if (this.canPerformAssay())
                return Cursor_1.Cursor.Assay;
            const result = getProperty(this.type, "cursor");
            if (result !== undefined)
                return typeof result === "function" ? result(this) : result;
            if (this.isMineable())
                return Cursor_1.Cursor.Mine;
            return undefined;
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
            return Sprite_2.default.get(`tile${category}/${TileType[type].toLowerCase()}`);
        }
        static render(tile, type, canvas, x, y, light, mask) {
            var _a;
            const description = tiles[type];
            if ((light !== null && light !== void 0 ? light : Infinity) <= 0 && (tile.context.world.stats.state === Constants_3.GameState.FellBehind || tile.revealed))
                light = 1;
            if (description.invisible && description.background === undefined || (light !== undefined && light <= 0))
                return;
            if (!description.invisible) {
                if (description.base !== undefined)
                    Tile_2.render(tile, description.base, canvas, x, y, undefined, mask);
                Tile_2.getSprite(type).render(canvas, x, y);
                if (mask && description.mask) {
                    const maskSprite = Sprite_2.default.get(`tile/mask/${description.mask}`);
                    canvas.context.globalCompositeOperation = "destination-out";
                    if (mask & Direction_2.default.North)
                        maskSprite.render(canvas, x, y, 0, 0, Constants_3.TILE, Constants_3.TILE);
                    if (mask & Direction_2.default.East)
                        maskSprite.render(canvas, x, y, Constants_3.TILE, 0, Constants_3.TILE, Constants_3.TILE);
                    if (mask & Direction_2.default.South)
                        maskSprite.render(canvas, x, y, Constants_3.TILE, Constants_3.TILE, Constants_3.TILE, Constants_3.TILE);
                    if (mask & Direction_2.default.West)
                        maskSprite.render(canvas, x, y, 0, Constants_3.TILE, Constants_3.TILE, Constants_3.TILE);
                }
            }
            canvas.context.globalCompositeOperation = "destination-over";
            if (description.background !== undefined && ((_a = tile === null || tile === void 0 ? void 0 : tile.context.y) !== null && _a !== void 0 ? _a : 0) >= Constants_3.SURFACE_TILES && (description.mask ? mask : true))
                Sprite_2.default.get(`tile/background/${TileType[description.background].toLowerCase()}`).render(canvas, x, y);
            canvas.context.globalCompositeOperation = "source-over";
            if (light !== undefined && light < LIGHT_MAX) {
                canvas.context.fillStyle = `rgba(0,0,0,${1 - Math.min(1, Math.max(0, light / LIGHT_MAX))})`;
                canvas.context.fillRect(x, y, Constants_3.TILE, Constants_3.TILE);
            }
        }
        render(canvas, x, y) {
            Tile_2.render(this, this.type, canvas, x, y, this.getLight(), this.getMask());
            if (this.breakAnim)
                Sprite_2.default.get(`tile/break/${this.breakAnim}`).render(canvas, x, y);
            if (this.hovering && this.isAccessible())
                Sprite_2.default.get("ui/hover").render(canvas, x, y);
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
            this.context.world.particles.create(Tile_2.getSprite(this.type), this.context.x * Constants_3.TILE + Constants_3.TILE / 2, this.context.y * Constants_3.TILE + Constants_3.TILE / 2, amount);
        }
        ////////////////////////////////////
        // Mouse events
        //
        handleEvent(api, mouse) {
            this.handleMouseEvent(api, mouse);
        }
        onMouseEnter(api, mouse) {
            if (this.handleMouseEvent(api, mouse) === false)
                return;
            this.hovering = true;
        }
        onMouseLeave(api, mouse) {
            if (this.handleMouseEvent(api, mouse) === false)
                return;
            this.hovering = false;
        }
        onMouseHold(api, mouse) {
            if (this.handleMouseEvent(api, mouse) === false)
                return;
            if (!this.hovering || !this.isAccessible())
                return;
            if (this.context.world.stats.exhaustion)
                return;
            this.context.world.stats.exhaustion = 10;
            this.damage(DamageType.Mining);
        }
        canPerformAssay() {
            var _a;
            return ((_a = this.getLight()) !== null && _a !== void 0 ? _a : 0) <= 0 && this.context.world.stats.score >= this.context.world.stats.assayCost;
        }
        onMouseRightClick(api, mouse) {
            if (this.handleMouseEvent(api, mouse) === false)
                return;
            if (!this.canPerformAssay())
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
        handleMouseEvent(api, mouse) {
            var _a, _b;
            return (_b = (_a = tiles[this.type])[`on${Strings_1.default.capitalise(api.event)}`]) === null || _b === void 0 ? void 0 : _b.call(_a, this, mouse);
        }
    };
    __decorate([
        Emitter_3.EventHost.Handler(Tile_2, "mouseMove"),
        Emitter_3.EventHost.Handler(Tile_2, "mouseDown"),
        Emitter_3.EventHost.Handler(Tile_2, "mouseUp"),
        Emitter_3.EventHost.Handler(Tile_2, "mouseClick")
    ], Tile.prototype, "handleEvent", null);
    __decorate([
        Emitter_3.EventHost.Handler(Tile_2, "mouseEnter")
    ], Tile.prototype, "onMouseEnter", null);
    __decorate([
        Emitter_3.EventHost.Handler(Tile_2, "mouseLeave")
    ], Tile.prototype, "onMouseLeave", null);
    __decorate([
        Emitter_3.EventHost.Handler(Tile_2, "mouseHold")
    ], Tile.prototype, "onMouseHold", null);
    __decorate([
        Emitter_3.EventHost.Handler(Tile_2, "mouseRightClick")
    ], Tile.prototype, "onMouseRightClick", null);
    Tile = Tile_2 = __decorate([
        Events_5.default.Bus(Events_5.EventBus.Tile)
    ], Tile);
    exports.default = Tile;
});
define("game/Stats", ["require", "exports", "Events", "Constants", "game/Tile"], function (require, exports, Events_6, Constants_4, Tile_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stats = exports.COST_ASSAY = exports.NOT_DISCOVERED = void 0;
    exports.NOT_DISCOVERED = -1;
    exports.COST_ASSAY = 1000;
    const LOCAL_STORAGE_KEY_SCORES = "scores";
    let Stats = class Stats {
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
            return this.mineshaftDepth - this.turn - Constants_4.TILES + 7;
        }
        reset() {
            this.dug = 0;
            this.turn = 0;
            this.tick = 0;
            this.exhaustion = 0;
            this.score = 0;
            this.state = Constants_4.GameState.Surface;
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
            this.state = Constants_4.GameState.Mining;
        }
        dig(tileType) {
            if (tileType === Tile_3.TileType.Rock)
                this.dug++;
            this.state = Constants_4.GameState.Mining;
        }
        addExplosive() {
            if (this.explosives === exports.NOT_DISCOVERED)
                this.explosives = 0;
            this.explosives++;
        }
        endGame() {
            this.state = Constants_4.GameState.FellBehind;
            this.scores.push(this.score);
            localStorage.setItem(LOCAL_STORAGE_KEY_SCORES, JSON.stringify(this.scores));
        }
    };
    Stats = __decorate([
        Events_6.default.Bus(Events_6.EventBus.Stats)
    ], Stats);
    exports.Stats = Stats;
});
define("util/Colour", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Colour {
        constructor(red, green, blue) {
            this.red = red;
            this.green = green;
            this.blue = blue;
        }
        getID() {
            return `color0x${this.toInt().toString(16).padStart(6, "0")}`;
        }
        getSVGColorMatrix() {
            return `${this.red / 255} 0 0 0 0 0 ${this.green / 255} 0 0 0 0 0 ${this.blue / 255} 0 0 0 0 0 1 0`;
        }
        static fromInt(int) {
            return new Colour((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF);
        }
        toInt() {
            let int = this.red;
            int = (int << 8) + this.green;
            int = (int << 8) + this.blue;
            return int;
        }
        static equals(color1, color2) {
            return color1.red === color2.red
                && color1.green === color2.green
                && color1.blue === color2.blue;
        }
    }
    exports.default = Colour;
    Colour.BLACK = new Colour(0, 0, 0);
    Colour.WHITE = new Colour(255, 255, 255);
});
define("ui/element/Scheme", ["require", "exports", "util/Colour"], function (require, exports, Colour_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scheme;
    (function (Scheme) {
        Scheme.COLOUR_FOREGROUND_PRIMARY = Colour_1.default.WHITE;
        Scheme.COLOUR_FOREGROUND_SECONDARY = Colour_1.default.fromInt(0xcccccc);
        Scheme.COLOUR_FOREGROUND_TERTIARY = Colour_1.default.fromInt(0x999999);
        Scheme.COLOUR_SHADOW = Colour_1.default.BLACK;
        Scheme.COLOUR_INPUT = Colour_1.default.fromInt(0x30ff7c);
    })(Scheme || (Scheme = {}));
    exports.default = Scheme;
});
define("ui/element/Style", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "ui/element/Scheme", "util/Colour", "util/Geometry"], function (require, exports, Emitter_4, Events_7, Scheme_1, Colour_2, Geometry_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INHERITED_STYLES = exports.Align = void 0;
    var Align;
    (function (Align) {
        Align[Align["Left"] = 0] = "Left";
        Align[Align["Centre"] = 1] = "Centre";
        Align[Align["Right"] = 2] = "Right";
    })(Align = exports.Align || (exports.Align = {}));
    exports.INHERITED_STYLES = {
        scale: true,
        colour: true,
        shadow: true,
        align: true,
        maxWidth: false,
        maxHeight: false,
        margin: false,
        padding: false,
    };
    const DEFAULT_STYLES = {
        align: Align.Left,
        scale: 1,
        colour: Scheme_1.default.COLOUR_FOREGROUND_PRIMARY,
        shadow: Scheme_1.default.COLOUR_SHADOW,
        maxWidth: Infinity,
        maxHeight: Infinity,
        margin: Geometry_2.Margin.ZERO,
        padding: Geometry_2.Margin.ZERO,
    };
    class Style extends (0, Emitter_4.EventHost)(Events_7.default) {
        static equals(property, value1, value2) {
            switch (property) {
                case "color": return Colour_2.default.equals(value1, value2);
                default: return value1 === value2;
            }
        }
        get(property) {
            return this[property];
        }
        set(property, value) {
            const style = this;
            const current = style[property];
            if (value === undefined || current === undefined || !Style.equals(property, value, current)) {
                style[property] = value;
                this.event.emit("change", { name: property, value });
            }
            return this;
        }
        remove(property) {
            return this.set(property);
        }
    }
    exports.default = Style;
    Style.DEFAULT = DEFAULT_STYLES;
});
define("ui/element/Element", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "ui/Canvas", "ui/element/Style", "util/decorator/Bound"], function (require, exports, Emitter_5, Events_8, Canvas_1, Style_1, Bound_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let id = 0;
    class Element extends (0, Emitter_5.EventHost)(Events_8.default) {
        constructor() {
            super();
            this.id = id++;
            this.shouldReflow = false;
            this.generating = false;
            this.shouldRerender = false;
            this.disposed = false;
            let set = Element.leakMap.get(this.constructor);
            if (!set)
                Element.leakMap.set(this.constructor, set = new Set());
            set.add(this);
        }
        get info() {
            var _a;
            return (_a = this._info) !== null && _a !== void 0 ? _a : this._pendingInfo;
        }
        get renderWidth() {
            var _a, _b;
            const info = (_a = this._pendingInfo) !== null && _a !== void 0 ? _a : this._info;
            return (_b = info === null || info === void 0 ? void 0 : info.width) !== null && _b !== void 0 ? _b : 0;
        }
        get renderHeight() {
            var _a, _b;
            const info = (_a = this._pendingInfo) !== null && _a !== void 0 ? _a : this._info;
            return (_b = info === null || info === void 0 ? void 0 : info.height) !== null && _b !== void 0 ? _b : 0;
        }
        get width() {
            var _a, _b;
            return (_b = (_a = this.info) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 0;
        }
        get height() {
            var _a, _b;
            return (_b = (_a = this.info) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
        }
        needsReflow() {
            return this.shouldReflow;
        }
        appendTo(element) {
            element.append(this);
            return this;
        }
        getStyle(property) {
            var _a, _b, _c, _d;
            return (_d = (_b = (_a = this.style) === null || _a === void 0 ? void 0 : _a.get(property)) !== null && _b !== void 0 ? _b : (Style_1.INHERITED_STYLES[property] ? (_c = this.parent) === null || _c === void 0 ? void 0 : _c.getStyle(property) : undefined)) !== null && _d !== void 0 ? _d : Style_1.default.DEFAULT[property];
        }
        setStyle(property, value) {
            if (!this.style && value !== undefined) {
                const style = this.style = new Style_1.default();
                this.event.emit("changeStyle", style);
                this.event.until(["changeStyle", "dispose"], subscriber => subscriber
                    .subscribe(style, "change", (_, property) => this.onChangeStyle(property)));
            }
            if (this.style) {
                if (value === undefined)
                    this.style.remove(property);
                else
                    this.style.set(property, value);
            }
            return this;
        }
        onChangeStyle(property) {
            switch (property.name) {
                case "colour":
                case "shadow":
                    this.markNeedsRerender();
                    break;
                case "scale":
                    this.markNeedsReflow();
                    break;
                case "margin":
                    // make parent element reflow
                    this.event.emit("needsReflow");
            }
        }
        markNeedsReflow() {
            if (!this.shouldReflow) {
                this.shouldReflow = true;
                this.event.emit("needsReflow");
            }
            return this;
        }
        draw(canvas, x, y) {
            var _a;
            (_a = this.getImage()) === null || _a === void 0 ? void 0 : _a.render(canvas, x, y);
        }
        markNeedsRerender() {
            if (!this.shouldRerender) {
                this.shouldRerender = true;
                this.event.emit("needsRender");
            }
            return this;
        }
        getImage() {
            if (!this.generating) {
                if (this.shouldReflow || !this.info)
                    this.forceReflow();
                if (!this.image || this.shouldRerender)
                    this.rendered = this.generateImage();
            }
            return this.image;
        }
        forceRefresh() {
            this.refresh();
            this.event.emit("refresh");
        }
        forceReflow() {
            this._pendingInfo = this.reflow();
            this.shouldReflow = false;
            this.event.emit("reflow");
            this.markNeedsRerender();
        }
        waitForRendered() {
            this.getImage();
            return this.rendered;
        }
        async generateImage() {
            this.generating = true;
            const result = new Canvas_1.default();
            const info = this._pendingInfo;
            const { width, height } = info;
            if (width !== 0 && height !== 0) {
                result.setSize(width, height);
                await this.render(result, info);
            }
            this.image = result;
            this._info = this._pendingInfo;
            this.shouldRerender = false;
            this.event.emit("render");
            this.generating = false;
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this.event.emit("dispose");
                Element.leakMap.get(this.constructor).delete(this);
            }
            return this;
        }
        setRefreshOn(on, event, when) {
            this.event.until("dispose", subscriber => subscriber
                .subscribe(on, event, ((api) => {
                if ((when === null || when === void 0 ? void 0 : when()) !== false)
                    this.forceRefresh();
                api.disregard = true;
            })));
            return this;
        }
        setRenderOn(on, event, when) {
            this.event.until("dispose", subscriber => subscriber
                .subscribe(on, event, ((api) => {
                if ((when === null || when === void 0 ? void 0 : when()) !== false)
                    this.markNeedsRerender();
                api.disregard = true;
            })));
            return this;
        }
    }
    Element.leakMap = new Map();
    __decorate([
        Bound_2.default
    ], Element.prototype, "markNeedsReflow", null);
    __decorate([
        Bound_2.default
    ], Element.prototype, "markNeedsRerender", null);
    exports.default = Element;
});
define("ui/element/Text", ["require", "exports", "ui/element/Element", "ui/Sprite", "util/Colour", "util/Enums"], function (require, exports, Element_1, Sprite_3, Colour_3, Enums_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CHAR_WIDTH = 6;
    const CHAR_HEIGHT = 9;
    var FontSprite;
    (function (FontSprite) {
        FontSprite[FontSprite["Wide"] = 0] = "Wide";
        FontSprite[FontSprite["Uppercase"] = 1] = "Uppercase";
        FontSprite[FontSprite["Lowercase"] = 2] = "Lowercase";
        FontSprite[FontSprite["Numbers"] = 3] = "Numbers";
        FontSprite[FontSprite["Symbols"] = 4] = "Symbols";
        FontSprite[FontSprite["WideSymbols"] = 5] = "WideSymbols";
    })(FontSprite || (FontSprite = {}));
    function char(width, ...chars) {
        if (typeof width === "string")
            chars.unshift(width), width = undefined;
        const codes = chars.flatMap(str => str.split("")).map(char => char.charCodeAt(0));
        if (codes.length === 1)
            return codes[0];
        return { codes, width };
    }
    function charRange(start, end) {
        return { start: start.charCodeAt(0), end: end.charCodeAt(0) };
    }
    function getSpriteIndexOffset(def, code) {
        var _a;
        if (typeof def === "number")
            return 0;
        const width = (_a = def.width) !== null && _a !== void 0 ? _a : CHAR_WIDTH;
        if ("codes" in def)
            return def.codes.indexOf(code) * width;
        return (code - def.start) * width;
    }
    const fontSpriteDefinitions = {
        [FontSprite.Wide]: char(9, "MmWw"),
        [FontSprite.Uppercase]: charRange("A", "Z"),
        [FontSprite.Lowercase]: charRange("a", "z"),
        [FontSprite.Numbers]: charRange("0", "9"),
        [FontSprite.Symbols]: char(".,“”‘’\"'?!_*$()+-/:;<=>[\\]^`{|}"),
        [FontSprite.WideSymbols]: char(8, "@#%&~"),
    };
    const characterWidthExceptions = {
        i: 3,
        I: 5,
        j: 5,
        l: 4,
        m: 9,
        M: 9,
        r: 5,
        T: 5,
        w: 8,
        W: 8,
        1: 5,
        ".": 3,
        ",": 3,
        "‘": 3,
        "’": 3,
        "'": 3,
        "!": 3,
        "(": 4,
        ")": 4,
        "+": 5,
        "-": 5,
        "/": 5,
        ":": 3,
        ";": 3,
        "<": 5,
        "=": 5,
        ">": 5,
        "[": 4,
        "\\": 5,
        "]": 4,
        "^": 4,
        "`": 4,
        "{": 5,
        "|": 3,
        "}": 5,
        "@": 8,
        "#": 8,
        "%": 8,
        "&": 7,
        "~": 8,
        "\n": 0,
    };
    const SVG = "http://www.w3.org/2000/svg";
    class Text extends Element_1.default {
        constructor(text) {
            super();
            this.setText(text);
        }
        setText(text) {
            if (typeof text === "function") {
                this.getter = text;
                this.forceRefresh();
            }
            else {
                this.text = text;
                this.markNeedsReflow();
            }
            return this;
        }
        equals(element) {
            return this.text === element.text;
        }
        refresh() {
            var _a, _b;
            const text = (_b = (_a = this.getter) === null || _a === void 0 ? void 0 : _a.call(this)) !== null && _b !== void 0 ? _b : this.text;
            if (text === this.text)
                return;
            this.text = text;
            this.markNeedsReflow();
        }
        reflow() {
            return {
                width: this.calculateWidth(),
                height: CHAR_HEIGHT * this.getStyle("scale"),
            };
        }
        async render(canvas) {
            const scale = this.getStyle("scale");
            const colour = this.getStyle("colour");
            const shadow = this.getStyle("shadow");
            await this.renderText(canvas, shadow, scale, 1);
            await this.renderText(canvas, colour, scale);
        }
        async renderText(canvas, colour, scale, y = 0) {
            var _a;
            const isWhite = Colour_3.default.equals(colour, Colour_3.default.WHITE);
            let svg;
            if (!isWhite) {
                svg = document.createElementNS(SVG, "svg");
                const filter = document.createElementNS(SVG, "filter");
                filter.id = colour.getID();
                const matrix = document.createElementNS(SVG, "feColorMatrix");
                matrix.setAttribute("type", "matrix");
                matrix.setAttribute("color-interpolation-filters", "sRGB");
                matrix.setAttribute("values", colour.getSVGColorMatrix());
                filter.appendChild(matrix);
                svg.appendChild(filter);
                document.body.appendChild(svg);
                canvas.context.filter = `url(#${filter.id})`;
            }
            let x = 0;
            for (let i = 0; i < this.text.length; i++) {
                const char = this.text[i];
                const code = this.text.charCodeAt(i);
                const width = (_a = characterWidthExceptions[char]) !== null && _a !== void 0 ? _a : CHAR_WIDTH;
                const fontSprite = this.getFontSprite(code);
                if (fontSprite !== undefined) {
                    const sprite = Sprite_3.default.get(`ui/font/${FontSprite[fontSprite].toLowerCase()}`);
                    await sprite.loaded;
                    const def = fontSpriteDefinitions[fontSprite];
                    const index = getSpriteIndexOffset(def, code);
                    canvas.context.imageSmoothingEnabled = false;
                    sprite.render(canvas, x, y * scale, width * scale, CHAR_HEIGHT * scale, index, 0, width, CHAR_HEIGHT);
                }
                x += width * scale;
            }
            if (svg) {
                canvas.context.filter = "none";
                svg.remove();
            }
        }
        getFontSprite(char) {
            for (const fontSprite of Enums_2.default.values(FontSprite)) {
                const definition = fontSpriteDefinitions[fontSprite];
                const matches = typeof definition === "number" ? definition === char
                    : "codes" in definition ? definition.codes.includes(char)
                        : char >= definition.start && char <= definition.end;
                if (matches)
                    return fontSprite;
            }
            return undefined;
        }
        calculateWidth() {
            var _a;
            this.forceRefresh();
            let width = 0;
            for (const char of this.text)
                width += ((_a = characterWidthExceptions[char]) !== null && _a !== void 0 ? _a : CHAR_WIDTH);
            return width * this.getStyle("scale");
        }
    }
    exports.default = Text;
});
define("ui/element/ContainerElement", ["require", "exports", "@@wayward/excevent/Emitter", "ui/element/Element", "ui/element/Text", "util/decorator/Bound"], function (require, exports, Emitter_6, Element_2, Text_1, Bound_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SYMBOL_NEWLINE = void 0;
    exports.SYMBOL_NEWLINE = Symbol("LAYOUT_NEWLINE");
    class ContainerElement extends Element_2.default {
        constructor() {
            super(...arguments);
            this.children = [];
            this.unresolvedChildren = [];
            this.deferredContainer = this;
        }
        refresh() {
            var _a, _b, _c, _d, _e, _f;
            const children = [];
            for (let child of this.unresolvedChildren) {
                if (typeof child === "function")
                    child = child();
                if (!Array.isArray(child))
                    child = [child];
                for (let subChild of child) {
                    if (typeof subChild === "string")
                        subChild = new Text_1.default(subChild);
                    if (subChild)
                        children.push(subChild);
                }
            }
            // dispose old pending children
            for (const child of (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : [])
                if (!children.includes(child))
                    (_c = (_b = child).dispose) === null || _c === void 0 ? void 0 : _c.call(_b);
            this.pendingChildren = children;
            for (const child of (_d = this.pendingChildren) !== null && _d !== void 0 ? _d : this.children) {
                (_f = (_e = child).forceRefresh) === null || _f === void 0 ? void 0 : _f.call(_e);
                if (child instanceof Element_2.default)
                    child.parent = this;
            }
            this.markNeedsReflow();
        }
        reflow() {
            var _a, _b, _c;
            for (const child of (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children)
                (_c = (_b = child).forceReflow) === null || _c === void 0 ? void 0 : _c.call(_b);
            return this.flow();
        }
        setDeferredContainer(container = this) {
            this.deferredContainer = container;
            return this;
        }
        append(...elements) {
            this.deferredContainer.addInternal(...elements);
            return this;
        }
        addInternal(...elements) {
            this.unresolvedChildren.push(...elements);
            for (const element of elements)
                if (element instanceof Element_2.default)
                    element.parent = this;
            this.forceRefresh();
            return this;
        }
        empty() {
            this.deferredContainer.clearInternal();
            return this;
        }
        clearInternal(fullClear = false) {
            var _a, _b;
            this.markNeedsReflow();
            for (const children of [this.pendingChildren, this.unresolvedChildren, ...fullClear ? [this.children] : []])
                for (const child of children !== null && children !== void 0 ? children : [])
                    (_b = (_a = child) === null || _a === void 0 ? void 0 : _a.dispose) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.unresolvedChildren.splice(0, Infinity);
            delete this.pendingChildren;
            return this;
        }
        onReflow() {
            var _a;
            for (const child of (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children) {
                if (child instanceof Element_2.default) {
                    child.event
                        .subscribe("needsReflow", this.markNeedsReflow)
                        .subscribe("needsRender", this.markNeedsRerender);
                    Promise.race([
                        this.event.waitFor("dispose"),
                        child.event.waitFor("dispose"),
                    ])
                        .then(() => child.event
                        .unsubscribe("needsReflow", this.markNeedsReflow)
                        .unsubscribe("needsRender", this.markNeedsRerender));
                }
            }
        }
        onDispose() {
            this.clearInternal(true);
        }
        onRender() {
            var _a, _b, _c;
            if (!this.pendingChildren)
                return;
            for (const child of this.children)
                if (!this.pendingChildren.includes(child))
                    (_b = (_a = child).dispose) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.children = (_c = this.pendingChildren) !== null && _c !== void 0 ? _c : [];
            delete this.pendingChildren;
        }
        forceRefresh() {
            this.refreshInternal.debounce(1);
        }
        refreshInternal() {
            super.forceRefresh();
        }
    }
    __decorate([
        Emitter_6.EventHost.Handler(ContainerElement, "reflow")
    ], ContainerElement.prototype, "onReflow", null);
    __decorate([
        Emitter_6.EventHost.Handler(ContainerElement, "dispose")
    ], ContainerElement.prototype, "onDispose", null);
    __decorate([
        Emitter_6.EventHost.Handler(ContainerElement, "render")
    ], ContainerElement.prototype, "onRender", null);
    __decorate([
        Bound_3.default
    ], ContainerElement.prototype, "refreshInternal", null);
    exports.default = ContainerElement;
});
define("ui/element/AbsoluteContainerElement", ["require", "exports", "ui/element/ContainerElement", "ui/element/Element"], function (require, exports, ContainerElement_1, Element_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbsoluteContainerElement extends ContainerElement_1.default {
        // override this so that we don't reflow children
        reflow() {
            var _a, _b, _c, _d, _e;
            for (const child of (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children)
                if ((_c = (_b = child).needsReflow) === null || _c === void 0 ? void 0 : _c.call(_b))
                    (_e = (_d = child).forceReflow) === null || _e === void 0 ? void 0 : _e.call(_d);
            return this.flow();
        }
        flow() {
            const maxWidth = this.getStyle("maxWidth");
            const maxHeight = this.getStyle("maxHeight");
            if (maxWidth === Infinity || maxHeight === Infinity) {
                console.warn(`AbsoluteContainerElement is missing either maxWidth (${maxWidth}) or maxHeight (${maxHeight})`, this);
                return {
                    width: 0,
                    height: 0,
                };
            }
            return {
                width: maxWidth,
                height: maxHeight,
            };
        }
        async render(canvas, info) {
            var _a, _b, _c;
            let { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = this.getStyle("padding");
            paddingTop !== null && paddingTop !== void 0 ? paddingTop : (paddingTop = 0);
            paddingRight !== null && paddingRight !== void 0 ? paddingRight : (paddingRight = 0);
            paddingBottom !== null && paddingBottom !== void 0 ? paddingBottom : (paddingBottom = 0);
            paddingLeft !== null && paddingLeft !== void 0 ? paddingLeft : (paddingLeft = 0);
            const children = (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children;
            for (const element of children) {
                if (!(element instanceof Element_3.default))
                    continue;
                let margin = element.getStyle("margin");
                if (typeof margin === "function")
                    margin = margin(element, this);
                const { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft } = margin;
                let x;
                if (marginLeft === undefined && marginRight !== undefined)
                    x = info.width - element.renderWidth - paddingRight - marginRight;
                else
                    x = paddingLeft + (marginLeft !== null && marginLeft !== void 0 ? marginLeft : 0);
                let y;
                if (marginTop === undefined && marginBottom !== undefined)
                    y = info.height - element.renderHeight - paddingBottom - marginBottom;
                else
                    y = paddingTop + (marginTop !== null && marginTop !== void 0 ? marginTop : 0);
                await ((_b = element.waitForRendered) === null || _b === void 0 ? void 0 : _b.call(element));
                (_c = element.draw) === null || _c === void 0 ? void 0 : _c.call(element, canvas, x, y);
            }
        }
    }
    exports.default = AbsoluteContainerElement;
});
define("ui/element/FlowContainerElement", ["require", "exports", "ui/element/ContainerElement", "ui/element/Style"], function (require, exports, ContainerElement_2, Style_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FlowContainerElement extends ContainerElement_2.default {
        flow() {
            var _a, _b, _c;
            const maxWidth = this.getStyle("maxWidth");
            const maxHeight = this.getStyle("maxHeight");
            let { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = this.getStyle("padding");
            paddingTop !== null && paddingTop !== void 0 ? paddingTop : (paddingTop = 0);
            paddingRight !== null && paddingRight !== void 0 ? paddingRight : (paddingRight = 0);
            paddingBottom !== null && paddingBottom !== void 0 ? paddingBottom : (paddingBottom = 0);
            paddingLeft !== null && paddingLeft !== void 0 ? paddingLeft : (paddingLeft = 0);
            const maxContentWidth = maxWidth - paddingLeft - paddingRight;
            const maxContentHeight = maxHeight - paddingTop - paddingBottom;
            const children = (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children;
            let width = 0;
            let lineHeight = 0;
            let lineWidth = 0;
            let height = 0;
            let needsToAddSplit = false;
            let lines = [];
            for (let i = 0; i < children.length; i++) {
                const element = children[i];
                const elementWidth = (_b = element.renderWidth) !== null && _b !== void 0 ? _b : 0;
                const elementHeight = (_c = element.renderHeight) !== null && _c !== void 0 ? _c : 0;
                const isNewline = element === ContainerElement_2.SYMBOL_NEWLINE;
                if (isNewline) {
                    if (needsToAddSplit || isNewline) {
                        if (isNewline)
                            lines.push({ index: i, dimensions: [0, 0] });
                        lines[lines.length - 1].index = i;
                    }
                    needsToAddSplit = false;
                }
                if (lineWidth + elementWidth > maxContentWidth || isNewline) {
                    height += lineHeight;
                    width = Math.max(lineWidth, width);
                    if (!isNewline)
                        lines.push({ index: -1, dimensions: [lineWidth, lineHeight] });
                    lines[lines.length - 1].dimensions = [lineWidth, lineHeight];
                    lineWidth = 0;
                    lineHeight = 0;
                    needsToAddSplit = !isNewline; // we've already added the split for newlines, but otherwise split at the next space
                }
                lineWidth += elementWidth;
                lineHeight = Math.max(lineHeight, elementHeight);
                if (elementWidth > maxContentWidth)
                    console.warn("Element overflowing horizontally:", element);
            }
            width = Math.max(lineWidth, width);
            height += lineHeight;
            lines.push({ index: Infinity, dimensions: [lineWidth, lineHeight] });
            if (height > maxContentHeight)
                console.warn("Elements overflowing vertically:", ...children);
            return {
                lines,
                width: Math.min(maxWidth, width + paddingLeft + paddingRight),
                height: Math.min(maxHeight, height + paddingTop + paddingBottom),
            };
        }
        async render(canvas, info) {
            var _a, _b, _c, _d, _e;
            const children = (_a = this.pendingChildren) !== null && _a !== void 0 ? _a : this.children;
            const lines = info.lines;
            let x;
            let y = 0;
            let splitIndex = 0;
            for (let i = 0; i < children.length; i++) {
                const line = lines[splitIndex];
                const [lineWidth, lineHeight] = (_b = line === null || line === void 0 ? void 0 : line.dimensions) !== null && _b !== void 0 ? _b : [0, 0];
                if (x === undefined) {
                    switch (this.getStyle("align")) {
                        case Style_2.Align.Left:
                            x = 0;
                            break;
                        case Style_2.Align.Centre:
                            x = canvas.width / 2 - lineWidth / 2;
                            break;
                        case Style_2.Align.Right:
                            x = canvas.width - lineWidth;
                            break;
                    }
                }
                const element = children[i];
                const isNewline = element === ContainerElement_2.SYMBOL_NEWLINE;
                const width = (_c = element.renderWidth) !== null && _c !== void 0 ? _c : 0;
                if (!isNewline && width) {
                    await ((_d = element.waitForRendered) === null || _d === void 0 ? void 0 : _d.call(element));
                    (_e = element.draw) === null || _e === void 0 ? void 0 : _e.call(element, canvas, x, y);
                }
                x += width;
                if ((line === null || line === void 0 ? void 0 : line.index) === i) {
                    splitIndex++;
                    x = undefined;
                    y += lineHeight;
                }
            }
        }
        onChangeStyle(property) {
            switch (property.name) {
                case "align":
                    this.markNeedsRerender();
                    break;
                case "maxWidth":
                case "maxHeight":
                case "padding":
                    this.markNeedsReflow();
                    break;
                default:
                    super.onChangeStyle(property);
            }
        }
    }
    exports.default = FlowContainerElement;
});
define("util/Watch", ["require", "exports", "util/decorator/Bound"], function (require, exports, Bound_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Watch {
        constructor(getter) {
            this.getter = getter;
        }
        changes() {
            const value = this.getter();
            if (this.lastValue === value)
                return false;
            this.lastValue = value;
            return true;
        }
    }
    __decorate([
        Bound_4.default
    ], Watch.prototype, "changes", null);
    function default_3(getter) {
        return new Watch(getter).changes;
    }
    exports.default = default_3;
});
define("ui/element/EphemeralElement", ["require", "exports", "Events", "ui/element/FlowContainerElement", "util/Watch"], function (require, exports, Events_9, FlowContainerElement_1, Watch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EphemeralElement extends FlowContainerElement_1.default {
        constructor(predicate) {
            super();
            this.predicate = predicate;
            this.setRefreshOn(Events_9.EventBus.Main, "update", (0, Watch_1.default)(predicate));
        }
        reflow() {
            if (!this.predicate())
                return { lines: [], width: 0, height: 0 };
            return super.reflow();
        }
        async render(canvas, info) {
            if (info.width === 0 || info.height === 0)
                return;
            return super.render(canvas, info);
        }
    }
    exports.default = EphemeralElement;
});
define("ui/element/LabelledValue", ["require", "exports", "ui/element/FlowContainerElement", "util/Colour"], function (require, exports, FlowContainerElement_2, Colour_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LabelledValue extends FlowContainerElement_2.default {
        constructor() {
            super();
            this.label = new FlowContainerElement_2.default()
                .setStyle("colour", Colour_4.default.fromInt(0xCCCCCC));
            this.contents = new FlowContainerElement_2.default();
            this.append(this.label, this.contents);
            this.setDeferredContainer(this.contents);
        }
        initialiseLabel(initialiser) {
            this.label.empty();
            initialiser(this.label);
            this.label.append(": ");
            return this;
        }
        setLabel(...contents) {
            this.label.empty()
                .append(...contents, ": ");
            return this;
        }
    }
    exports.default = LabelledValue;
});
define("ui/hud/Abilities", ["require", "exports", "Constants", "Events", "game/Stats", "ui/element/ContainerElement", "ui/element/EphemeralElement", "ui/element/LabelledValue", "ui/element/Scheme", "ui/element/Style", "ui/element/Text", "util/Watch"], function (require, exports, Constants_5, Events_10, Stats_1, ContainerElement_3, EphemeralElement_1, LabelledValue_1, Scheme_2, Style_3, Text_2, Watch_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbilitiesElement extends EphemeralElement_1.default {
        constructor(stats) {
            super(() => stats.state === Constants_5.GameState.Mining
                && (stats.explosives !== Stats_1.NOT_DISCOVERED || stats.discoveredAssays));
            this
                .setStyle("align", Style_3.Align.Right)
                .append(new LabelledValue_1.default()
                .setLabel("ABILITIES")
                .append(new Text_2.default("Right Click").setStyle("colour", Scheme_2.default.COLOUR_INPUT)))
                .append(ContainerElement_3.SYMBOL_NEWLINE)
                .append(new EphemeralElement_1.default(() => stats.discoveredAssays)
                .append(new LabelledValue_1.default()
                .setLabel("Assay Cost")
                .append(new Text_2.default(() => `$${stats.assayCost}`)
                .setRefreshOn(Events_10.EventBus.Main, "update", (0, Watch_2.default)(() => stats.assayCost)))))
                .append(ContainerElement_3.SYMBOL_NEWLINE)
                .append(new EphemeralElement_1.default(() => stats.explosives !== Stats_1.NOT_DISCOVERED)
                .append(new LabelledValue_1.default()
                .setLabel("Explosives")
                .append(new Text_2.default("Have ").setStyle("colour", Scheme_2.default.COLOUR_FOREGROUND_TERTIARY))
                .append(new Text_2.default(() => `${stats.explosives}`)
                .setRefreshOn(Events_10.EventBus.Main, "update", (0, Watch_2.default)(() => stats.explosives)))));
        }
    }
    exports.default = AbilitiesElement;
});
define("ui/hud/Score", ["require", "exports", "Constants", "Events", "ui/element/ContainerElement", "ui/element/EphemeralElement", "ui/element/FlowContainerElement", "ui/element/LabelledValue", "ui/element/Scheme", "ui/element/Text", "util/Watch"], function (require, exports, Constants_6, Events_11, ContainerElement_4, EphemeralElement_2, FlowContainerElement_3, LabelledValue_2, Scheme_3, Text_3, Watch_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ScoreElement extends FlowContainerElement_3.default {
        constructor(stats) {
            super();
            this
                .append(new EphemeralElement_2.default(() => stats.state === Constants_6.GameState.Surface)
                .append(new LabelledValue_2.default()
                .setLabel("Highest stock value")
                .append(new Text_3.default(() => `$${stats.highscore}`)
                .setRefreshOn(Events_11.EventBus.Main, "update", (0, Watch_3.default)(() => stats.highscore)))))
                .append(new EphemeralElement_2.default(() => stats.state !== Constants_6.GameState.Surface)
                .append(new LabelledValue_2.default()
                .setLabel("Depth")
                .append(new Text_3.default(() => `${stats.turn}`)
                .setRefreshOn(Events_11.EventBus.Main, "update", (0, Watch_3.default)(() => stats.turn)))
                .append(new EphemeralElement_2.default(() => stats.scheduledDepthDifference)
                .append(new Text_3.default(" (").setStyle("colour", Scheme_3.default.COLOUR_FOREGROUND_TERTIARY))
                .append(new Text_3.default(() => `${stats.scheduledDepthDifference > 0 ? "+" : ""}${stats.scheduledDepthDifference}`)
                .setRefreshOn(Events_11.EventBus.Main, "update", (0, Watch_3.default)(() => stats.scheduledDepthDifference)))
                .append(new Text_3.default(")").setStyle("colour", Scheme_3.default.COLOUR_FOREGROUND_TERTIARY))))
                .append(ContainerElement_4.SYMBOL_NEWLINE)
                .append(new EphemeralElement_2.default(() => stats.turn * 10 !== stats.score)
                .append(new LabelledValue_2.default()
                .setLabel("Stock value")
                .append(new Text_3.default(() => `$${stats.score}`)
                .setRefreshOn(Events_11.EventBus.Main, "update", (0, Watch_3.default)(() => stats.score))))));
        }
    }
    exports.default = ScoreElement;
});
define("ui/hud/Hud", ["require", "exports", "Constants", "Events", "ui/element/AbsoluteContainerElement", "ui/element/EphemeralElement", "ui/hud/Abilities", "ui/hud/Score", "util/Geometry", "util/Watch"], function (require, exports, Constants_7, Events_12, AbsoluteContainerElement_1, EphemeralElement_3, Abilities_1, Score_1, Geometry_3, Watch_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Hud extends AbsoluteContainerElement_1.default {
        constructor(stats) {
            super();
            this.stats = stats;
            this.score = new Score_1.default(this.stats)
                .setStyle("margin", new Geometry_3.Margin().setBottom(0))
                .appendTo(this);
            this.abilities = new Abilities_1.default(this.stats)
                .setStyle("margin", new Geometry_3.Margin().setBottom(0).setRight(0))
                .appendTo(this);
            this.title = new EphemeralElement_3.default(() => this.stats.state !== Constants_7.GameState.Mining)
                .append(() => this.stats.state === Constants_7.GameState.Surface ? "DIG DIG DIG" : "GAME OVER!")
                .setStyle("scale", 4)
                .setStyle("margin", (self, container) => new Geometry_3.Margin()
                .setLeft(container.renderWidth / 2 - self.renderWidth / 2)
                .setTop(container.renderHeight / 4 - self.renderHeight / 2 + Math.floor(Math.sin(this.stats.tick / 200) * 10)))
                .setRefreshOn(Events_12.EventBus.Main, "update", (0, Watch_4.default)(() => this.stats.state === Constants_7.GameState.Surface))
                .appendTo(this);
            this.author = new EphemeralElement_3.default(() => this.stats.state === Constants_7.GameState.Surface)
                .append("by Chirichirichiri")
                .setStyle("scale", 2)
                .setStyle("margin", (self, container) => new Geometry_3.Margin()
                .setLeft(container.renderWidth / 2 + this.title.renderWidth / 2 - self.renderWidth)
                .setTop(container.renderHeight / 4 + this.title.renderHeight / 2 + 5 + Math.floor(Math.sin((this.stats.tick - 200) / 200) * 10)))
                .setRefreshOn(Events_12.EventBus.Main, "update", (0, Watch_4.default)(() => this.stats.state === Constants_7.GameState.Surface))
                .appendTo(this);
            this.hint = new EphemeralElement_3.default(() => this.stats.state !== Constants_7.GameState.Mining)
                .append(() => this.stats.state === Constants_7.GameState.Surface ? "Use the mouse to start mining!" : "Click anywhere to play again!")
                .setStyle("margin", (self, container) => new Geometry_3.Margin()
                .setLeft(container.renderWidth - self.renderWidth - 10 + Math.floor(Math.sin(this.stats.tick / 40) * -3))
                .setTop(container.renderHeight - self.renderHeight - 30 + Math.floor(Math.sin(this.stats.tick / 40) * 5)))
                .setRefreshOn(Events_12.EventBus.Main, "update", (0, Watch_4.default)(() => this.stats.state === Constants_7.GameState.Surface))
                .appendTo(this);
            this.setStyle("padding", Geometry_3.Margin.of(5).setBottom(2))
                .setStyle("maxWidth", Constants_7.CANVAS)
                .setStyle("maxHeight", Constants_7.CANVAS);
            this.setRenderOn(Events_12.EventBus.Main, "update");
        }
    }
    exports.default = Hud;
});
define("ui/Ui", ["require", "exports", "Events", "ui/hud/Hud", "Constants"], function (require, exports, Events_13, Hud_1, Constants_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ui = void 0;
    let Ui = class Ui {
        constructor(stats) {
            this.stats = stats;
            this.hud = new Hud_1.default(this.stats);
        }
        render(canvas) {
            this.hud.draw(canvas, 0, 0);
        }
        onMouseDown() {
            if (this.stats.state === Constants_8.GameState.FellBehind)
                this.stats.reset();
        }
    };
    __decorate([
        Events_13.default.Handler(Events_13.EventBus.Mouse, "down")
    ], Ui.prototype, "onMouseDown", null);
    Ui = __decorate([
        Events_13.default.Subscribe,
        Events_13.default.Bus(Events_13.EventBus.Ui)
    ], Ui);
    exports.Ui = Ui;
});
define("dig", ["require", "exports", "@@wayward/excevent/Emitter", "Events", "ui/Cursor", "util/prototype/Function", "Constants", "game/Stats", "game/World", "ui/Canvas", "ui/Mouse", "ui/Particles", "ui/Ui", "ui/View", "util/Sound"], function (require, exports, Emitter_7, Events_14, Cursor_2, Function_1, Constants_9, Stats_2, World_1, Canvas_2, Mouse_1, Particles_1, Ui_1, View_1, Sound_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cursor = exports.ui = exports.view = exports.mouse = exports.canvas = exports.particles = exports.world = exports.stats = exports.Main = void 0;
    (0, Function_1.default)();
    let Main = class Main extends (0, Emitter_7.EventHost)(Events_14.default) {
    };
    Main = __decorate([
        Events_14.default.Bus(Events_14.EventBus.Main)
    ], Main);
    exports.Main = Main;
    const main = new Main();
    ////////////////////////////////////
    // Game
    //
    exports.stats = new Stats_2.Stats();
    exports.world = new World_1.default(exports.stats);
    ////////////////////////////////////
    // UI
    //
    Sound_2.default.preload();
    exports.particles = new Particles_1.Particles();
    exports.world.setParticles(exports.particles);
    exports.canvas = new Canvas_2.default().setSize(Constants_9.CANVAS, Constants_9.CANVAS).appendTo(document.body);
    function setCanvasSize() {
        const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / Constants_9.CANVAS) * Constants_9.CANVAS;
        exports.canvas.setDisplaySize(size, size);
        exports.canvas.invalidateOffset();
    }
    setCanvasSize();
    setTimeout(setCanvasSize, 200);
    window.addEventListener("resize", setCanvasSize);
    exports.mouse = new Mouse_1.Mouse(exports.canvas);
    exports.view = new View_1.View(exports.world, exports.mouse);
    exports.ui = new Ui_1.Ui(exports.stats);
    exports.cursor = new Cursor_2.default();
    ////////////////////////////////////
    // Render & Update
    //
    const updateInterval = Math.floor(1000 / 60);
    function update() {
        exports.stats.update();
        exports.mouse.update();
        exports.world.update();
        exports.particles.update();
        exports.view.update(exports.stats);
        main.event.emit("update");
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
define("Events", ["require", "exports", "@@wayward/excevent/Excevent"], function (require, exports, Excevent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventBus = void 0;
    var EventBus;
    (function (EventBus) {
        EventBus[EventBus["Main"] = 0] = "Main";
        EventBus[EventBus["Mouse"] = 1] = "Mouse";
        EventBus[EventBus["Stats"] = 2] = "Stats";
        EventBus[EventBus["Tile"] = 3] = "Tile";
        EventBus[EventBus["Ui"] = 4] = "Ui";
        EventBus[EventBus["View"] = 5] = "View";
        EventBus[EventBus["World"] = 6] = "World";
    })(EventBus = exports.EventBus || (exports.EventBus = {}));
    exports.default = new Excevent_1.default();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9Db25zdGFudHMudHMiLCIuLi90cy91dGlsL3R5cGUudHMiLCIuLi90cy91dGlsL2RlY29yYXRvci9Cb3VuZC50cyIsIi4uL3RzL3V0aWwvR2VvbWV0cnkudHMiLCIuLi90cy91aS9DYW52YXMudHMiLCIuLi90cy91aS9Nb3VzZS50cyIsIi4uL3RzL3VpL0N1cnNvci50cyIsIi4uL3RzL3V0aWwvcHJvdG90eXBlL0Z1bmN0aW9uLnRzIiwiLi4vdHMvdXRpbC9TdHJpbmdzLnRzIiwiLi4vdHMvdWkvU3ByaXRlLnRzIiwiLi4vdHMvdXRpbC9EaXJlY3Rpb24udHMiLCIuLi90cy91dGlsL1JhbmRvbS50cyIsIi4uL3RzL3V0aWwvRW51bXMudHMiLCIuLi90cy91dGlsL1NvdW5kLnRzIiwiLi4vdHMvdXRpbC9NYXRocy50cyIsIi4uL3RzL3VpL1ZpZXcudHMiLCIuLi90cy91aS9QYXJ0aWNsZXMudHMiLCIuLi90cy9nYW1lL1dvcmxkLnRzIiwiLi4vdHMvZ2FtZS9UaWxlLnRzIiwiLi4vdHMvZ2FtZS9TdGF0cy50cyIsIi4uL3RzL3V0aWwvQ29sb3VyLnRzIiwiLi4vdHMvdWkvZWxlbWVudC9TY2hlbWUudHMiLCIuLi90cy91aS9lbGVtZW50L1N0eWxlLnRzIiwiLi4vdHMvdWkvZWxlbWVudC9FbGVtZW50LnRzIiwiLi4vdHMvdWkvZWxlbWVudC9UZXh0LnRzIiwiLi4vdHMvdWkvZWxlbWVudC9Db250YWluZXJFbGVtZW50LnRzIiwiLi4vdHMvdWkvZWxlbWVudC9BYnNvbHV0ZUNvbnRhaW5lckVsZW1lbnQudHMiLCIuLi90cy91aS9lbGVtZW50L0Zsb3dDb250YWluZXJFbGVtZW50LnRzIiwiLi4vdHMvdXRpbC9XYXRjaC50cyIsIi4uL3RzL3VpL2VsZW1lbnQvRXBoZW1lcmFsRWxlbWVudC50cyIsIi4uL3RzL3VpL2VsZW1lbnQvTGFiZWxsZWRWYWx1ZS50cyIsIi4uL3RzL3VpL2h1ZC9BYmlsaXRpZXMudHMiLCIuLi90cy91aS9odWQvU2NvcmUudHMiLCIuLi90cy91aS9odWQvSHVkLnRzIiwiLi4vdHMvdWkvVWkudHMiLCIuLi90cy9kaWcudHMiLCIuLi90cy9FdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztJQUFhLFFBQUEsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFFBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLFFBQUEsYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUNuQixRQUFBLE1BQU0sR0FBRyxZQUFJLEdBQUcsYUFBSyxDQUFDO0lBRW5DLElBQVksU0FJWDtJQUpELFdBQVksU0FBUztRQUNwQiwrQ0FBTyxDQUFBO1FBQ1AsNkNBQU0sQ0FBQTtRQUNOLHFEQUFVLENBQUE7SUFDWCxDQUFDLEVBSlcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFJcEI7Ozs7Ozs7OztJRVBELG1CQUFpRCxNQUFXLEVBQUUsR0FBVyxFQUFFLFVBQXNDO1FBQ2hILE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFFNUIsT0FBTztZQUNOLFlBQVksRUFBRSxJQUFJO1lBQ2xCLEdBQUc7Z0JBQ0YsNkZBQTZGO2dCQUM3RixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxFQUFFLEtBQUssVUFBVSxFQUFFO29CQUMvRixPQUFPLEVBQU8sQ0FBQztpQkFDZjtnQkFFRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7b0JBQ2hDLFlBQVksRUFBRSxJQUFJO29CQUNsQixLQUFLLEVBQUUsT0FBTztpQkFDZCxDQUFDLENBQUM7Z0JBRUgsT0FBTyxPQUFZLENBQUM7WUFDckIsQ0FBQztTQUNELENBQUM7SUFDSCxD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
import { TILE, TILES } from "./Constants";
import { Stats } from "./game/Stats";
import World from "./game/World";
import Canvas from "./ui/Canvas";
import { Mouse } from "./ui/Mouse";
import { View } from "./ui/View";
import Sound from "./util/Sound";


////////////////////////////////////
// Game
//

export const stats = new Stats();
export const world = new World(stats);
export const view = new View();


////////////////////////////////////
// UI
//

Sound.preload();


export const canvas = new Canvas().setSize(TILE * TILES, TILE * TILES).appendTo(document.body);

function setCanvasSize () {
	const realSize = TILES * TILE;
	const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / realSize) * realSize;
	canvas.setDisplaySize(size, size);
	canvas.invalidateOffset();
}

setCanvasSize();
window.addEventListener("resize", setCanvasSize);


export const mouse = new Mouse()
	.setWorld(world)
	.setView(view)
	.setCanvas(canvas);


////////////////////////////////////
// Render & Update
// It's a jam game, don't complain
//

function update () {
	requestAnimationFrame(update);

	stats.update();
	mouse.update();
	world.update();
	view.update(world, stats, mouse);


	render();
}

function render () {
	canvas.clear();
	view.render(world, canvas);
}

update();

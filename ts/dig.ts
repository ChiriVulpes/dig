import { TILE, TILES } from "./Constants";
import { Stats } from "./game/Stats";
import World from "./game/World";
import Canvas from "./ui/Canvas";
import { Mouse } from "./ui/Mouse";
import { Particles } from "./ui/Particles";
import { Ui } from "./ui/Ui";
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

export const particles = new Particles();
world.setParticles(particles);


export const canvas = new Canvas().setSize(TILE * TILES, TILE * TILES).appendTo(document.body);

function setCanvasSize () {
	const realSize = TILES * TILE;
	const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / realSize) * realSize;
	canvas.setDisplaySize(size, size);
	canvas.invalidateOffset();
}

setCanvasSize();
setTimeout(setCanvasSize, 200);
window.addEventListener("resize", setCanvasSize);


export const ui = new Ui(stats);


export const mouse = new Mouse()
	.setWorld(world)
	.setView(view)
	.setCanvas(canvas)
	.setUi(ui);


////////////////////////////////////
// Render & Update
//

const updateInterval = 1000 / 60;

function update () {
	stats.update();
	mouse.update();
	world.update();
	particles.update();
	view.update(world, stats, mouse);
}

let lastFrame = 0;
function render () {
	requestAnimationFrame(render);

	const now = Date.now();
	if (now - lastFrame < updateInterval)
		return;

	lastFrame = now;
	update();

	canvas.clear();
	view.render(world, canvas);
	particles.render(canvas, view);
	ui.render(canvas);
}

render();

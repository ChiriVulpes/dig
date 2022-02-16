import { EventHost } from "@@wayward/excevent/Emitter";
import Events, { EventBus } from "Events";
import CursorHandler from "ui/Cursor";
import applyFunctionPrototypes from "util/prototype/Function";
import { CANVAS } from "./Constants";
import { Stats } from "./game/Stats";
import World from "./game/World";
import Canvas from "./ui/Canvas";
import { Mouse } from "./ui/Mouse";
import { Particles } from "./ui/Particles";
import { Ui } from "./ui/Ui";
import { View } from "./ui/View";
import Sound from "./util/Sound";

applyFunctionPrototypes();

export interface IMainEvents {
	update (): any;
}

@Events.Bus(EventBus.Main)
export class Main extends EventHost(Events)<IMainEvents> { }
const main = new Main();


////////////////////////////////////
// Game
//

export const stats = new Stats();
export const world = new World(stats);


////////////////////////////////////
// UI
//

Sound.preload();

export const particles = new Particles();
world.setParticles(particles);


export const canvas = new Canvas().setSize(CANVAS, CANVAS).appendTo(document.body);

function setCanvasSize () {
	const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / CANVAS) * CANVAS;
	canvas.setDisplaySize(size, size);
	canvas.invalidateOffset();
}

setCanvasSize();
setTimeout(setCanvasSize, 200);
window.addEventListener("resize", setCanvasSize);


export const mouse = new Mouse(canvas);

export const view = new View(world, mouse);

export const ui = new Ui(stats);

export const cursor = new CursorHandler();


////////////////////////////////////
// Render & Update
//

const updateInterval = Math.floor(1000 / 60);

function update () {
	stats.update();
	mouse.update();
	world.update();
	particles.update();
	view.update(stats);
	main.event.emit("update");
}

let lastFrame = 0;
function render () {
	requestAnimationFrame(render);

	const now = Date.now();
	const elapsed = now - lastFrame;
	if (elapsed < updateInterval)
		return;

	lastFrame = now - (elapsed % updateInterval);
	update();

	canvas.clear();
	view.render(canvas);
	particles.render(canvas, view);
	ui.render(canvas);
}

render();

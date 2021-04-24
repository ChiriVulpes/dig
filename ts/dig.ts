import { TILE, TILES } from "./Constants";
import { TileType } from "./game/Tile";
import World from "./game/World";
import Canvas from "./ui/Canvas";
import { View } from "./ui/View";


////////////////////////////////////
// Game
//

export const world = new World();
for (let y = 0; y < world.height; y++) {
	for (let x = 0; x < world.width; x++) {
		world.setTile(x, y, TileType.Rock);
	}
}

export const view = new View();


////////////////////////////////////
// UI
//

export const renderCanvas = new Canvas().setSize(TILE * TILES, TILE * TILES).appendTo(document.body);
// export const outputCanvas = new Canvas().appendTo(document.body);


function setCanvasSize () {
	const realSize = TILES * TILE;
	const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) / realSize) * realSize;
	renderCanvas.setDisplaySize(size, size);
}

setCanvasSize();
window.addEventListener("resize", setCanvasSize);


////////////////////////////////////
// Render
//

function render () {
	requestAnimationFrame(render);

	renderCanvas.clear();

	view.render(world, renderCanvas);
	// renderCanvas.render(outputCanvas);
}

render();

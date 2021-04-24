enum Direction {
	None,
	North = 1,
	East = 2,
	South = 4,
	West = 8,
}

export default Direction;

export namespace Directions {
	export function move (x: number, y: number, direction: Direction): [x: number, y: number] {
		switch (direction) {
			case Direction.North: return [x, y - 1];
			case Direction.East: return [x + 1, y];
			case Direction.South: return [x, y + 1];
			case Direction.West: return [x - 1, y];
		}

		return [x, y];
	}
}

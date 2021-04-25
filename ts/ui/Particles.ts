import Maths from "../util/Maths";
import Random from "../util/Random";
import Canvas from "./Canvas";
import Sprite from "./Sprite";
import { View } from "./View";

interface IParticle {
	sprite: Sprite;
	x: number;
	y: number;
	xv: number;
	yv: number;
	xo: number;
	yo: number;
	life: number;
}

export class Particles {

	private readonly particles: IParticle[] = [];

	public create (sprite: Sprite, x: number, y: number, count: number) {
		for (let i = 0; i < count; i++) {
			const [xv, yv] = Maths.direction(Random.float(Math.PI * 2), Random.float(2, 4));
			this.particles.push({
				sprite,
				x, y,
				xv, yv,
				xo: Random.float(0.75), yo: Random.float(0.75),
				life: 500,
			});
		}
	}

	public update () {
		for (let i = 0; i < this.particles.length; i++) {
			const particle = this.particles[i];
			particle.xv *= 0.95;
			particle.yv *= 0.95;
			particle.yv += 0.2;
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

	public render (canvas: Canvas, view: View) {
		for (const particle of this.particles)
			particle.sprite.render(canvas, particle.x, particle.y - view.y,
				Math.floor(particle.sprite.width * particle.xo), Math.floor(particle.sprite.height * particle.yo),
				particle.sprite.width / 4, particle.sprite.height / 4);
	}
}

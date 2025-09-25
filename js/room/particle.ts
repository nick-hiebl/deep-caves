import type { Rect } from '../core/math';

const GRAVITY = 2.5 / 1000;

export class Particle implements Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    color: string;
    xVelocity: number;
    yVelocity: number;

    lifeLeft: number;
    lifespan: number;

    alive: boolean;
    affectedByGravity: boolean;

    constructor(x: number, y: number, width: number, height: number, color: string, vX: number, vY: number, lifespan: number, affectedByGravity = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.xVelocity = vX;
        this.yVelocity = vY;

        this.lifeLeft = lifespan;
        this.lifespan = lifespan;

        this.alive = true;

        this.affectedByGravity = affectedByGravity;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.filter = `opacity(${Math.round(100 * this.lifeLeft / this.lifespan)}%)`;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
        ctx.filter = 'none';
    }

    update(frameDuration: number) {
        if (this.affectedByGravity) {
            this.yVelocity += frameDuration * GRAVITY;
        }

        this.x += frameDuration * this.xVelocity;
        this.y += frameDuration * this.yVelocity;

        this.lifeLeft = Math.max(0, this.lifeLeft - frameDuration);

        if (this.lifeLeft <= 0) {
            this.alive = false;
        }
    }
}

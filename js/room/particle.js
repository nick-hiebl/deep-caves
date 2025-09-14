class Particle {
    constructor(x, y, width, height, color, vX, vY, lifespan) {
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
    }

    draw(ctx) {
        ctx.filter = `opacity(${Math.round(100 * this.lifeLeft / this.lifespan)}%)`;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
        ctx.filter = 'none';
    }

    update(frameDuration) {
        this.x += frameDuration * this.xVelocity;
        this.y += frameDuration * this.yVelocity;

        this.lifeLeft = Math.max(0, this.lifeLeft - frameDuration);

        if (this.lifeLeft <= 0) {
            this.alive = false;
        }
    }
}

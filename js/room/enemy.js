const ENEMY_RADIUS = 24;

const X_SPEED = 300 / 1000;
const X_ACCEL = 1 / 1000;
const Y_ACCEL = 2 / 1000;

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.xVelocity = 0;
        this.yVelocity = 0;

        this.radius = ENEMY_RADIUS;

        this.actor = new Actor(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }

    draw(ctx) {
        ctx.fillStyle = 'purple';

        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }

    update(frameDuration, _solids, playerPosition) {
        if (playerPosition) {
            if (playerPosition.x < this.x) {
                this.xVelocity = approach(-X_SPEED, this.xVelocity, X_ACCEL * FRAME_DURATION);
            } else {
                this.xVelocity = approach(X_SPEED, this.xVelocity, X_ACCEL * FRAME_DURATION);
            }
            if (playerPosition.y < this.y) {
                this.yVelocity = approach(-X_SPEED, this.yVelocity, Y_ACCEL * FRAME_DURATION);
            } else {
                this.yVelocity = approach(X_SPEED, this.yVelocity, Y_ACCEL * FRAME_DURATION);
            }
        }

        this.actor.moveX(this.xVelocity * frameDuration, () => {}, []);
        this.actor.moveY(this.yVelocity * frameDuration, () => {}, []);

        this.x = this.actor.x + this.radius / 2;
        this.y = this.actor.y + this.radius / 2;
    }
}
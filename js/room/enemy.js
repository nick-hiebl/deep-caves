const ENEMY_RADIUS = 24;

const X_SPEED = 300 / 1000;
const X_ACCEL = 1 / 1000;
const Y_ACCEL = 2 / 1000;

const GHOSTY_SPRITE = new Image();
GHOSTY_SPRITE.src = './img/ghosty.png';

const ENEMY_WIDTH = 24;
const ENEMY_HEIGHT = 32;
const VISUAL_SCALE = 2;

class Enemy {
    constructor(x, y) {
        this.width = ENEMY_WIDTH * VISUAL_SCALE;
        this.height = ENEMY_HEIGHT * VISUAL_SCALE;

        this.xVelocity = 0;
        this.yVelocity = 0;

        this.actor = new Actor(x, y, this.width, this.height);

        this.hp = 3;
        this.alive = true;

        this.facing = 'left';
    }

    draw(ctx) {
        ctx.drawImage(
            GHOSTY_SPRITE,
            this.facing === 'left' ? 0 : ENEMY_WIDTH,
            0,
            ENEMY_WIDTH,
            ENEMY_HEIGHT,
            this.actor.x,
            this.actor.y,
            this.actor.width,
            this.actor.height,
        );

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'white';
            ctx.strokeRect(this.actor.x, this.actor.y, this.actor.width, this.actor.height);
        }
    }

    update(frameDuration, _solids, playerPosition) {
        const myMidpoint = this.actor.getMidpoint();

        if (playerPosition) {
            if (playerPosition.x < myMidpoint.x) {
                this.xVelocity = approach(-X_SPEED, this.xVelocity, X_ACCEL * FRAME_DURATION);

                this.facing = 'left';
            } else {
                this.xVelocity = approach(X_SPEED, this.xVelocity, X_ACCEL * FRAME_DURATION);

                this.facing = 'right';
            }
            if (playerPosition.y < myMidpoint.y) {
                this.yVelocity = approach(-X_SPEED, this.yVelocity, Y_ACCEL * FRAME_DURATION);
            } else {
                this.yVelocity = approach(X_SPEED, this.yVelocity, Y_ACCEL * FRAME_DURATION);
            }
        } else {
            this.facing = this.xVelocity < 0 ? 'left' : 'right';
        }

        this.actor.moveX(this.xVelocity * frameDuration, () => { }, []);
        this.actor.moveY(this.yVelocity * frameDuration, () => { }, []);
    }

    applyDamage() {
        this.hp -= 1;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }
}

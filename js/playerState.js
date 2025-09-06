/** Debug option */
const DRAW_FRAME_MARKERS = false;

/** Player physics details */
const PLAYER_WIDTH = 14;
const PLAYER_HEIGHT = 18;
const COLLISION_CROSS_INSET = 10;

/** Player speed per millisecond */
const SPEED = 450 / 1000;
const JUMP_MAGNITUDE = 1;

const LEFT_KEY = 'a';
const RIGHT_KEY = 'd';
const JUMP_KEY = ' ';

class PlayerState {
    constructor(x, y) {
        this.lastState = { x, y };

        this.x = x;
        this.y = y;
        this.height = PLAYER_HEIGHT;
        this.width = PLAYER_WIDTH;

        this.actor = new Actor(this.x - this.width, this.y - this.height, this.width * 2, this.height * 2);

        this.xVelocity = 0;
        this.yVelocity = 0;

        this.jumpController = new JumpController();
    }

    draw(ctx, _canvas, mousePosition, interpolationFactor) {
        if (DRAW_FRAME_MARKERS) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.lastState.x - this.width, this.lastState.y - this.height, this.width * 2, this.height * 2);

            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - this.width, this.y - this.height, this.width * 2, this.height * 2);
        }

        const xInterp = lerp(this.lastState.x, this.x, interpolationFactor);
        const yInterp = lerp(this.lastState.y, this.y, interpolationFactor);

        ctx.fillStyle = 'white';
        ctx.fillRect(xInterp - this.width, yInterp - this.height, this.width * 2, this.height * 2);

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'yellow';

            ctx.strokeRect(this.actor.x, this.actor.y, this.actor.width, this.actor.height);

            if (this.jumpController.isGrounded) {
                ctx.fillStyle = 'pink';
                ctx.fillRect(this.x - COLLISION_CROSS_INSET, this.y - COLLISION_CROSS_INSET, 2 * COLLISION_CROSS_INSET, 2 * COLLISION_CROSS_INSET);
            }
            if (this.jumpController.coyoteTime > 0) {
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x - COLLISION_CROSS_INSET, this.y - COLLISION_CROSS_INSET, COLLISION_CROSS_INSET, COLLISION_CROSS_INSET);
            }
        }
    }

    update(mousePosition, keyboardState, frameDuration, solids) {
        this.lastState = { x: this.x, y: this.y };

        const xInput = (keyboardState[RIGHT_KEY] ? 1 : 0) - (keyboardState[LEFT_KEY] ? 1 : 0);
        const xVelocity = xInput * SPEED;

        const { yAcceleration, isJumping } = this.jumpController.update(keyboardState, frameDuration, this.yVelocity);

        this.yVelocity += yAcceleration * frameDuration;

        if (isJumping) {
            this.yVelocity = -JUMP_MAGNITUDE;
        }

        this.xVelocity = xVelocity;

        this.actor.moveX(this.xVelocity * frameDuration, () => { this.xVelocity = 0 }, solids);
        this.actor.moveY(this.yVelocity * frameDuration, () => { this.yVelocity = 0 }, solids);

        this.x = this.actor.x + this.width;
        this.y = this.actor.y + this.height;

        const groundingSolid = solids.find(solid => isPointInside(solid, this.x - this.width, this.y + this.height))
            /** Subtract one from x so we can't wall jump */
            ?? solids.find(solid => isPointInside(solid, this.x + this.width - 1, this.y + this.height));

        this.jumpController.groundedCheck(!!groundingSolid, isJumping);
    }
}

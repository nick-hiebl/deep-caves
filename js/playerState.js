/** Debug option */
const DRAW_FRAME_MARKERS = true;

/** Player physics details */
const PLAYER_WIDTH = 14;
const PLAYER_HEIGHT = 18;
const COLLISION_CROSS_INSET = 10;

/** Player speed per millisecond */
const SPEED = 300 / 1000;
const GRAVITY = 4 / 1000;
const JUMP_MAGNITUDE = 1;

/** Physics utils */
const COYOTE_DURATION = 100;

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
        
        this.jumpController.update(keyboardState, frameDuration);

        const isJumping = this.jumpController.isJumping();

        if (!this.isGrounded) {
            this.yVelocity += GRAVITY * frameDuration;
        }
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

class JumpController {
    constructor() {
        this.isGrounded = false;
        this.coyoteTime = 0;
        this.timeSinceJumpPress = COYOTE_DURATION * 2;
        this.isJumpKeyDown = false;
    }

    isJumping() {
        const isJumpDesired = this.isJumpKeyDown && this.timeSinceJumpPress < COYOTE_DURATION;

        const isJumping = isJumpDesired && (this.isGrounded || this.coyoteTime > 0);

        if (isJumping) {
            this.timeSinceJumpPress = COYOTE_DURATION * 2;
            this.coyoteTime = 0;
        }

        return isJumping;
    }

    update(keyboardState, frameDuration) {
        this.coyoteTime -= frameDuration;

        if (keyboardState[JUMP_KEY]) {
            if (this.isJumpKeyDown) {
                this.timeSinceJumpPress += frameDuration;
            } else {
                this.isJumpKeyDown = true;
                this.timeSinceJumpPress = 0;
            }
        } else {
            this.isJumpKeyDown = false;
            this.timeSinceJumpPress = COYOTE_DURATION * 2;
        }
    }

    groundedCheck(nowGrounded, nowJumping) {
        if (this.isGrounded && !nowGrounded && !nowJumping) {
            this.coyoteTime = COYOTE_DURATION;
        } else if (nowGrounded) {
            this.coyoteTime = 0;
        }

        this.isGrounded = nowGrounded;
    }
}

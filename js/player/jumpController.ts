const GRAVITY = 2.1 / 1000;
const HIGH_GRAVITY = 4.5 / 1000;

const Y_VELOCITY_CUTOFF = -0.2;

/** Physics utils */
const COYOTE_DURATION = 100;

export const JUMP_KEY = ' ';

export class JumpController {
    isGrounded: boolean;
    coyoteTime: number;
    timeSinceJumpPress: number;
    isJumpKeyDown: boolean;
    stillHoldingJump: boolean;

    constructor() {
        this.isGrounded = false;
        this.coyoteTime = 0;
        this.timeSinceJumpPress = COYOTE_DURATION * 2;
        this.isJumpKeyDown = false;
        this.stillHoldingJump = false;
    }

    update(keyboardState: Record<string, boolean>, frameDuration: number, yVelocity: number) {
        this.coyoteTime -= frameDuration;

        if (keyboardState[JUMP_KEY]) {
            if (this.isJumpKeyDown) {
                this.timeSinceJumpPress += frameDuration;
            } else {
                this.isJumpKeyDown = true;
                this.timeSinceJumpPress = 0;
            }
        } else {
            this.stillHoldingJump = false;
            this.isJumpKeyDown = false;
            this.timeSinceJumpPress = COYOTE_DURATION * 2;
        }

        const isJumpDesired = this.isJumpKeyDown && this.timeSinceJumpPress < COYOTE_DURATION;

        const isJumping = isJumpDesired && (this.isGrounded || this.coyoteTime > 0);

        if (isJumping) {
            this.stillHoldingJump = true;
            this.timeSinceJumpPress = COYOTE_DURATION * 2;
            this.coyoteTime = 0;
        }

        return { isJumping, yAcceleration: this.getGravity(yVelocity) };
    }

    getGravity(yVelocity: number) {
        if (yVelocity > Y_VELOCITY_CUTOFF || !this.stillHoldingJump) {
            return HIGH_GRAVITY;
        }

        return GRAVITY;
    }

    groundedCheck(nowGrounded: boolean, nowJumping: boolean) {
        if (this.isGrounded && !nowGrounded && !nowJumping) {
            this.coyoteTime = COYOTE_DURATION;
        } else if (nowGrounded) {
            this.coyoteTime = 0;
        }

        this.isGrounded = nowGrounded;
    }
}

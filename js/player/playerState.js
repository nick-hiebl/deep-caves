/** Debug option */
const DRAW_FRAME_MARKERS = false;

/** Player physics details */
const PLAYER_WIDTH = 14;
const PLAYER_HEIGHT = 18;
const COLLISION_CROSS_INSET = 10;

/** Player speed per millisecond */
const SPEED = 450 / 1000;
const PLAYER_X_ACCEL = 8 / 1000;
const JUMP_MAGNITUDE = 1;

/** Attack parameters */
const ATTACK_DURATION = 100;
const ATTACK_COOLDOWN = 250;
const ATTACK_BUFFER = 300;

const LEFT_KEY = 'a';
const RIGHT_KEY = 'd';
const JUMP_KEY = ' ';
const ATTACK_KEY = 'j';

const PLAYER_SPRITE = new Image();
PLAYER_SPRITE.src = './img/sword_man.png';

const getImageCoordinates = (attacking, facing, hasShield) => {
    let x = 0, y = 0;
    if (facing === 'right') {
        x += PLAYER_WIDTH * 2;
    }
    if (attacking) {
        y += PLAYER_HEIGHT * 2;
    }
    if (hasShield) {
        x += PLAYER_WIDTH * 4;
    }

    return { x, y };
};

class PlayerState {
    constructor(x, y) {
        this.lastState = { x, y };

        this.x = x;
        this.y = y;
        this.height = PLAYER_HEIGHT * 2;
        this.width = PLAYER_WIDTH * 2;

        this.actor = new Actor(this.x - this.width, this.y - this.height, this.width * 2, this.height * 2);

        this.xVelocity = 0;
        this.yVelocity = 0;

        this.facing = 'left';

        this.jumpController = new JumpController();
        this.attackController = new BufferedThrottledInputController(ATTACK_BUFFER, ATTACK_COOLDOWN, ATTACK_DURATION);

        this.attacks = [];
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

        const isAttacking = this.attackController.isActive;
        const attackTransparency = 1 - square(this.attackController.fractionThroughCooldown() ?? 0);

        this.attacks.forEach(attack => {
            attack.prePlayerDraw(ctx, { x: xInterp, y: yInterp }, attackTransparency);
        });

        const { x: sx, y: sy } = getImageCoordinates(isAttacking, this.facing, true);
        ctx.drawImage(PLAYER_SPRITE, sx, sy, PLAYER_WIDTH * 2, PLAYER_HEIGHT * 2, xInterp - this.width, yInterp - this.height, this.width * 2, this.height * 2);

        this.attacks.forEach(attack => {
            attack.postPlayerDraw(ctx, { x: xInterp, y: yInterp }, attackTransparency);
        });

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'yellow';

            ctx.strokeRect(this.actor.x, this.actor.y, this.actor.width, this.actor.height);
        }
    }

    update(_mousePosition, keyboardState, frameDuration, solids, enemies) {
        this.lastState = { x: this.x, y: this.y };

        this.attackController.update(frameDuration, keyboardState[ATTACK_KEY], () => {
            this.attacks = [new Attack(this.facing)];
        });

        if (!this.attackController.isActive) {
            this.attacks = [];
        }

        this.attacks.forEach(attack => {
            enemies.forEach(enemy => {
                attack.interactWithEnemy(this.lastState, enemy);
            })
        });

        const xInput = (keyboardState[RIGHT_KEY] ? 1 : 0) - (keyboardState[LEFT_KEY] ? 1 : 0);
        const xVelocity = approach(xInput * SPEED, this.xVelocity, PLAYER_X_ACCEL);

        const { yAcceleration, isJumping } = this.jumpController.update(keyboardState, frameDuration, this.yVelocity);

        this.yVelocity += yAcceleration * frameDuration;

        if (isJumping) {
            this.yVelocity = -JUMP_MAGNITUDE;
        }

        this.xVelocity = xVelocity;

        if (xInput > 0) {
            this.facing = 'right';
        } else if (xInput < 0) {
            this.facing = 'left';
        }

        this.actor.moveX(this.xVelocity * frameDuration, () => { }, solids);
        this.actor.moveY(this.yVelocity * frameDuration, () => { this.yVelocity = 0 }, solids);

        this.x = this.actor.x + this.width;
        this.y = this.actor.y + this.height;

        const groundingCollider = { x: this.x - this.width, y: this.y + this.height, width: this.width * 2, height: 1 };

        const groundingSolid = solids.find(solid => overlaps(solid, groundingCollider));

        this.jumpController.groundedCheck(!!groundingSolid, isJumping);
    }
}

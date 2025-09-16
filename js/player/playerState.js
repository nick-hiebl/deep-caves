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
const DOWN_KEY = 's';
const RIGHT_KEY = 'd';
const JUMP_KEY = ' ';
const ATTACK_KEY = 'j';

const PLAYER_SPRITE = Sprite('./img/sword_man.png');

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
        x = Math.round(x);
        y = Math.round(y);

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

    update(_mousePosition, keyboardState, frameDuration, room) {
        const solids = room.solids;
        const enemies = room.enemies;

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
            });
        });

        const xInput = (keyboardState[RIGHT_KEY] ? 1 : 0) - (keyboardState[LEFT_KEY] ? 1 : 0);
        const xVelocity = approach(xInput * SPEED, this.xVelocity, PLAYER_X_ACCEL);

        const { yAcceleration, isJumping } = this.jumpController.update(keyboardState, frameDuration, this.yVelocity);

        this.yVelocity += yAcceleration * frameDuration;

        if (isJumping) {
            const PARTICLE_RADIUS = 2;
            for (let i = 0; i < 8; i++) {
                const relX = randfloat(-1, 1);
                room.addParticle(new Particle(
                    this.actor.x + (1 + relX) * this.actor.width / 2 * 1 - PARTICLE_RADIUS,
                    this.actor.y + this.actor.height - PARTICLE_RADIUS,
                    PARTICLE_RADIUS * 2,
                    PARTICLE_RADIUS * 2,
                    'white',
                    relX * 0.3,
                    (Math.random() < 0.6 ? 1 : -1) * randfloat(0.15, 0.2),
                    140,
                ));
            }

            this.yVelocity = -JUMP_MAGNITUDE;
        }

        this.xVelocity = xVelocity;

        if (xInput > 0) {
            this.facing = 'right';
        } else if (xInput < 0) {
            this.facing = 'left';
        }

        this.actor.setDropping(keyboardState[DOWN_KEY]);

        this.actor.moveX(this.xVelocity * frameDuration, () => { }, solids);
        this.actor.moveY(this.yVelocity * frameDuration, () => { this.yVelocity = 0 }, solids);

        this.x = this.actor.x + this.width;
        this.y = this.actor.y + this.height;

        const isGrounded = this.actor.isGrounded(solids);

        this.jumpController.groundedCheck(isGrounded, isJumping);
    }
}

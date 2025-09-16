const GHOST_WIDTH = 200;
const GHOST_COLLIDER_WIDTH = 120;

const GHOST_BOSS_SPEED = 500 / 1000;

const GhostBossSprite = Sprite('./img/theghost.png');

const INSIDE_COLLIDER = {
    x: 100,
    y: 100,
    width: ROOM_SCALE_WIDTH - 200,
    height: ROOM_SCALE_HEIGHT - 200,
};

const SCREEN_COLLIDER = {
    x: -100,
    y: -100,
    width: ROOM_SCALE_WIDTH + 200,
    height: ROOM_SCALE_HEIGHT + 200,
};

class GhostBoss {
    constructor(x, y) {
        this.hp = 20;
        this.alive = true;

        this.isNonPhysical = false;
        this.facing = 'left';

        this.x = x;
        this.y = y;

        this.collider = {
            x: this.x - GHOST_COLLIDER_WIDTH / 2,
            y: this.y - GHOST_COLLIDER_WIDTH / 2,
            width: GHOST_COLLIDER_WIDTH,
            height: GHOST_COLLIDER_WIDTH,
        };

        this.hurtVisualiser = incDecLatch(1, 250);

        this.strategy = 'initialWait';
        this.isStrategyComplete = false;
        this.cooldown = incDecLatch(500, 1);
    }

    update(frameDuration, _room, playerPosition) {
        this.hurtVisualiser.down(frameDuration);

        switch (this.strategy) {
            case 'initialWait':
                if (isPointInside(INSIDE_COLLIDER, playerPosition.x, playerPosition.y)) {
                    this.initFlee(playerPosition);
                }
                return;
            case 'flee':
                this.collider.x += this.xVelocity * frameDuration;
                this.collider.y += this.yVelocity * frameDuration;

                if (!overlaps(SCREEN_COLLIDER, this.collider)) {
                    this.initCharge(playerPosition);
                }
                return;
            case 'charge':
                this.collider.x += this.xVelocity * frameDuration;
                this.collider.y += this.yVelocity * frameDuration;

                if (this.isDoneCharging()) {
                    this.initFlee(playerPosition);
                }
                return;
            case 'wait':
                return;
        }
    }

    initFlee(playerPosition) {
        this.strategy = 'flee';

        const myMidpoint = rectMidpoint(this.collider);

        const direction = {
            x: playerPosition.x - myMidpoint.x,
            y: playerPosition.y - myMidpoint.y,
        };
        const speed = normalize(direction, GHOST_BOSS_SPEED);

        this.xVelocity = speed.x;
        this.yVelocity = speed.y;
    }

    initCharge(playerPosition) {
        this.strategy = 'charge';

        const myMidpoint = rectMidpoint(this.collider);

        const px = playerPosition.x;
        const py = playerPosition.y;

        const direction = {
            x: px - myMidpoint.x,
            y: py - myMidpoint.y,
        };
        const speed = normalize(direction, GHOST_BOSS_SPEED);

        this.xVelocity = speed.x;
        this.yVelocity = speed.y;

        this.isDoneCharging = () => {
            const pos = rectMidpoint(this.collider);

            return speed.x > 0
                ? pos.x > px
                : speed.x < 0
                ? pos.x < px
                : speed.y > 0
                ? pos.y > py
                : pos.y < py;
        };
    }

    draw(ctx) {
        if (this.hurtVisualiser.check() > 0) {
            ctx.filter = 'brightness(10000%) saturate(0%)';
        }

        const x = Math.round(this.collider.x);
        const y = Math.round(this.collider.y);

        const OFFSET = (GHOST_WIDTH - GHOST_COLLIDER_WIDTH) / 2;
        ctx.drawImage(
            GhostBossSprite,
            0,
            0,
            GhostBossSprite.width,
            GhostBossSprite.height,
            x - OFFSET,
            y - OFFSET,
            this.collider.width + 2 * OFFSET,
            this.collider.height + 2 * OFFSET,
        );

        ctx.filter = 'none';

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'yellow';
            ctx.strokeRect(x, y, this.collider.width, this.collider.height);
        }
    }

    applyDamage(_box) {
        this.hp -= 1;
        this.hurtVisualiser.up(1);

        if (this.hp < 0) {
            this.alive = false;
        }
    }

    intersects(box) {
        if (overlaps(box, this.collider)) {
            return this.collider;
        }
    }
}

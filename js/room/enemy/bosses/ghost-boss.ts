import { DRAW_FRAME_MARKERS } from '../../../constants';
import { incDecLatch, type IncDecLatch } from '../../../core/latch';
import { distance, isPointInside, normalize, overlaps, randomPerimeterPoint, randomPointInRect, rectMidpoint, type Rect, type Vector } from '../../../core/math';
import { Sprite } from '../../../core/sprite';
import { Particle } from '../../particle';
import { Room, ROOM_SCALE_HEIGHT, ROOM_SCALE_WIDTH } from '../../room';

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

export class GhostBoss {
    hp: number;
    alive: boolean;

    isNonPhysical: boolean;
    facing: 'left' | 'right';
    x: number;
    y: number;

    xVelocity: number = 0;
    yVelocity: number = 0;

    collider: Rect;

    hurtVisualiser: IncDecLatch;
    particleCooldown: IncDecLatch;

    strategy: 'initialWait' | 'flee' | 'charge';

    isStrategyComplete: boolean;

    distFromStart: () => number;
    distFromTarget: () => number;

    constructor(x: number, y: number) {
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
        this.particleCooldown = incDecLatch(1, 40);

        this.strategy = 'initialWait';
        this.isStrategyComplete = false;

        this.distFromStart = () => 0;
        this.distFromTarget = () => 0;
    }

    update(frameDuration: number, room: Room, playerPosition: Vector) {
        this.hurtVisualiser.down(frameDuration);
        this.particleCooldown.down(frameDuration);

        switch (this.strategy) {
            case 'initialWait':
                if (isPointInside(INSIDE_COLLIDER, playerPosition.x, playerPosition.y)) {
                    this.initFlee(playerPosition);
                }
                return;
            case 'flee':
                const fleeSpeedMod = 0.8 + Math.min(1.2, this.distFromStart() / 600);
                this.collider.x += this.xVelocity * frameDuration * fleeSpeedMod;
                this.collider.y += this.yVelocity * frameDuration * fleeSpeedMod;

                if (!overlaps(SCREEN_COLLIDER, this.collider)) {
                    this.initCharge(playerPosition);
                }

                this.addParticle(room);
                return;
            case 'charge':
                const speedMod = 0.8 + Math.min(1.2, this.distFromTarget() / 600);
                this.collider.x += this.xVelocity * frameDuration * speedMod;
                this.collider.y += this.yVelocity * frameDuration * speedMod;

                if (this.distFromTarget() <= 10) {
                    this.initFlee(playerPosition);
                }

                this.addParticle(room);
                return;
        }
    }

    addParticle(room: Room) {
        if (this.particleCooldown.check() <= 0) {
            const pPos = randomPointInRect(this.collider);
            const RADIUS = 4;
            room.addParticle(new Particle(
                pPos.x - RADIUS / 2,
                pPos.y - RADIUS / 2,
                4,
                4,
                'white',
                this.xVelocity * 0.3,
                this.yVelocity * 0.3,
                360,
                false,
            ));
            this.particleCooldown.up(1);
        }
    }

    initFlee(playerPosition: Vector) {
        this.strategy = 'flee';

        const startingPoint = rectMidpoint(this.collider);

        const direction = {
            x: playerPosition.x - startingPoint.x,
            y: playerPosition.y - startingPoint.y,
        };
        const speed = normalize(direction, GHOST_BOSS_SPEED);

        this.xVelocity = speed.x;
        this.yVelocity = speed.y;

        this.distFromStart = () => {
            return distance(rectMidpoint(this.collider), startingPoint);
        }
    }

    initCharge(playerPosition: Vector) {
        this.strategy = 'charge';

        /** Choose new starting point */
        const startingPoint = randomPerimeterPoint(SCREEN_COLLIDER);

        this.collider.x = startingPoint.x - GHOST_COLLIDER_WIDTH / 2;
        this.collider.y = startingPoint.y - GHOST_COLLIDER_WIDTH / 2;

        const px = playerPosition.x;
        const py = playerPosition.y;

        const direction = {
            x: px - startingPoint.x,
            y: py - startingPoint.y,
        };
        const speed = normalize(direction, GHOST_BOSS_SPEED);

        this.xVelocity = speed.x;
        this.yVelocity = speed.y;

        this.distFromTarget = () => {
            const pos = rectMidpoint(this.collider);

            return distance(pos, { x: px, y: py });
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
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

    applyDamage(_box: Rect) {
        this.hp -= 1;
        this.hurtVisualiser.up(1);

        if (this.hp < 0) {
            this.alive = false;
        }
    }

    intersects(box: Rect) {
        if (overlaps(box, this.collider)) {
            return this.collider;
        }
    }
}

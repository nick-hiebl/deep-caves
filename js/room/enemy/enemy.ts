import { DRAW_FRAME_MARKERS } from '../../constants';
import { Actor } from '../../core/actor';
import { incDecLatch, type IncDecLatch } from '../../core/latch';
import { approach, overlaps, type Rect, type Vector } from '../../core/math';
import { Sprite } from '../../core/sprite';
import type { Room } from '../room';

import type { EnemyInterface } from './interface';

const ENEMY_RADIUS = 24;

const X_SPEED = 300 / 1000;
const X_ACCEL = 1 / 1000;
const Y_ACCEL = 2 / 1000;

const GHOSTY_SPRITE = Sprite('./img/ghosty.png');

const ENEMY_WIDTH = 24;
const ENEMY_HEIGHT = 32;
const VISUAL_SCALE = 2;

export class Enemy implements EnemyInterface {
    xVelocity: number;
    yVelocity: number;

    actor: Actor;

    hp: number;
    alive: boolean;

    facing: 'left' | 'right';

    isNonPhysical: boolean;

    hurtVisualiser: IncDecLatch;

    constructor(x: number, y: number) {
        this.xVelocity = 0;
        this.yVelocity = 0;

        this.actor = new Actor(x, y, ENEMY_WIDTH * VISUAL_SCALE, ENEMY_HEIGHT * VISUAL_SCALE);

        this.hp = 3;
        this.alive = true;

        this.facing = 'left';

        this.isNonPhysical = true;

        this.hurtVisualiser = incDecLatch(1, 250);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.hurtVisualiser.check() > 0) {
            ctx.filter = 'brightness(1000%) saturate(0%)';
        }
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
        ctx.filter = 'none';

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'white';
            ctx.strokeRect(this.actor.x, this.actor.y, this.actor.width, this.actor.height);
        }
    }

    update(frameDuration: number, room: Room, playerPosition: { x: number; y: number }) {
        this.updateVelocities(frameDuration, room, playerPosition);

        if (this.isNonPhysical) {
            this.actor.moveX(this.xVelocity * frameDuration, () => { }, []);
            this.actor.moveY(this.yVelocity * frameDuration, () => { }, []);
        } else {
            this.actor.moveX(this.xVelocity * frameDuration, () => { this.xVelocity = 0 }, room.solids);
            this.actor.moveY(this.yVelocity * frameDuration, () => { this.yVelocity = 0 }, room.solids);
        }

        this.hurtVisualiser.down(frameDuration);
    }

    updateVelocities(frameDuration: number, _room: Room, playerPosition: Vector) {
        const myMidpoint = this.actor.getMidpoint();

        if (playerPosition) {
            if (playerPosition.x < myMidpoint.x) {
                this.xVelocity = approach(-X_SPEED, this.xVelocity, X_ACCEL * frameDuration);

                this.facing = 'left';
            } else {
                this.xVelocity = approach(X_SPEED, this.xVelocity, X_ACCEL * frameDuration);

                this.facing = 'right';
            }
            if (playerPosition.y < myMidpoint.y) {
                this.yVelocity = approach(-X_SPEED, this.yVelocity, Y_ACCEL * frameDuration);
            } else {
                this.yVelocity = approach(X_SPEED, this.yVelocity, Y_ACCEL * frameDuration);
            }
        } else {
            this.facing = this.xVelocity < 0 ? 'left' : 'right';
        }
    }

    applyDamage(_box: Rect, impulse: Partial<Vector>) {
        this.hp -= 1;

        this.xVelocity += impulse?.x ?? 0;
        this.yVelocity += impulse?.y ?? 0;

        if (this.hp <= 0) {
            this.alive = false;
        }

        this.hurtVisualiser.up();
    }

    intersects(box: Rect) {
        if (overlaps(box, this.actor)) {
            return this.actor;
        }
    }
}

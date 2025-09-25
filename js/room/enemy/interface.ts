import type { Rect, Vector } from '../../core/math';
import type { Room } from '../room';

export interface EnemyInterface {
    /** Boolean property indicating alive-ness. */
    alive: boolean;

    draw(ctx: CanvasRenderingContext2D): void;

    update(frameDuration: number, room: Room, playerPosition: Vector): void;

    applyDamage(box: Rect, impulse: Partial<Vector>): void;

    intersects(box: Rect): Rect | undefined;
}

import type { Actor } from './actor';
import { overlaps } from './math';

export type SolidConfig = {
    isDroppable?: boolean;
};

export class Solid {
    x: number;
    y: number;
    height: number;
    width: number;

    isCollidable: boolean;
    isDroppable: boolean;
    color: string | undefined;

    xRemainder: number;
    yRemainder: number;

    blocker: boolean;

    constructor(x: number, y: number, width: number, height: number, config: SolidConfig = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.isCollidable = true;
        this.isDroppable = config.isDroppable ?? false;
        this.blocker = false;

        this.xRemainder = 0;
        this.yRemainder = 0;
    }

    move(x: number, y: number, actors: Actor[], solids: Solid[]) {
        this.xRemainder += x;
        this.yRemainder += y;

        let moveX = Math.round(this.xRemainder);
        let moveY = Math.round(this.yRemainder);

        if (moveX !== 0 || moveY !== 0) {
            const riding = actors.filter(actor => actor.isRiding(this));

            this.isCollidable = false;

            if (moveX !== 0) {
                this.xRemainder -= moveX;
                this.x += moveX;

                if (moveX > 0) {
                    for (const actor of actors) {
                        if (overlaps(this, actor)) {
                            /** Push right */
                            actor.moveX(this.x + this.width - actor.x, actor.squish, solids);
                        } else if (riding.some(a => a === actor)) {
                            /** Carry right */
                            actor.moveX(moveX, () => {}, solids);
                        }
                    }
                } else if (moveX < 0) {
                    for (const actor of actors) {
                        if (overlaps(this, actor)) {
                            /** Push left */
                            actor.moveX(this.x - (actor.x + actor.width), actor.squish, solids);
                        } else if (riding.some(a => a === actor)) {
                            /** Carry left */
                            actor.moveX(moveX, () => {}, solids);
                        }
                    }
                }
            }

            this.isCollidable = true;
        }
    }
}

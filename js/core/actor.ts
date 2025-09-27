import type { Component } from '../ecs/ecs';

import { overlaps } from './math';
import { Solid } from './solid';

export class Actor implements Component {
    x: number;
    y: number;
    width: number;
    height: number;

    private xRemainder: number;
    private yRemainder: number;

    isDropping: boolean;
    droppingSet: Set<any>;
    grounded: boolean;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.xRemainder = 0;
        this.yRemainder = 0;

        this.isDropping = false;
        this.droppingSet = new Set();

        this.grounded = false;
    }

    setDropping(isDropping: boolean | undefined) {
        this.isDropping = !!isDropping;

        this.droppingSet = new Set(Array.from(this.droppingSet).filter(solid => overlaps(this, solid)));
    }

    moveX(amount: number, onCollide: (solid: Solid) => void, solids: Solid[]) {
        this.xRemainder += amount;
        let move = Math.round(this.xRemainder);

        if (move !== 0) {
            this.xRemainder -= move;
            const sign = move > 0 ? 1 : -1;

            while (move !== 0) {
                this.x += sign;
                move -= sign;

                /** Backtrack one step on collision and return */
                const { collidingSolid, droppingThroughSolids } = this.collideAt(solids);

                /** If entering a droppable solid horizontally, you fall through it */
                droppingThroughSolids.forEach(solid => {
                    this.droppingSet.add(solid);
                });

                if (collidingSolid) {
                    this.x -= sign;
                    onCollide(collidingSolid);
                    break;
                }
            }
        }
    }

    moveY(amount: number, onCollide: (solid: Solid) => void, solids: Solid[]) {
        this.yRemainder += amount;
        let move = Math.round(this.yRemainder);

        if (move !== 0) {
            this.yRemainder -= move;
            const sign = move > 0 ? 1 : -1;

            /** Process leftovers if any */
            while (move !== 0) {
                this.y += sign;
                move -= sign;

                /** Backtrack one step on collision and return */
                let { collidingSolid, droppingThroughSolids } = this.collideAt(solids);

                /** If moving up or dropping then just mark solids we are dropping through */
                if ((sign < 0 || this.isDropping) && droppingThroughSolids.length > 0) {
                    droppingThroughSolids.forEach(solid => this.droppingSet.add(solid));
                } else if (droppingThroughSolids.length > 0) {
                    /** We are falling and not dropping through platforms */
                    collidingSolid = droppingThroughSolids[0];
                }

                if (collidingSolid) {
                    this.y -= sign;
                    onCollide(collidingSolid);
                    break;
                }
            }
        }
    }

    isGrounded(solids: Solid[]) {
        const groundingCollider = { x: this.x, y: this.y + this.height, width: this.width, height: 1 };

        const groundingSolid = solids.find(solid => {
            if (this.droppingSet.has(solid)) {
                return false;
            }

            if (this.isDropping && solid.isDroppable) {
                return false;
            }

            return overlaps(groundingCollider, solid);
        });

        this.grounded = !!groundingSolid;

        return this.grounded;
    }

    collideAt(solids: Solid[]) {
        const droppingThroughSolids: Solid[] = [];

        const collidingSolid = solids.find(solid => {
            if (!solid.isCollidable) {
                return false;
            }

            const overlapping = overlaps(this, solid);

            if (!overlapping) {
                return false;
            }

            if (solid.isDroppable) {
                if (!this.droppingSet.has(solid)) {
                    droppingThroughSolids.push(solid);
                } else {
                    // return true;
                }
                return false;
            }

            return true;
        });

        return { collidingSolid, droppingThroughSolids };
    }

    isRiding(solid: Solid) {
        return overlaps(solid, { x: this.x, y: this.y + this.height, width: this.width, height: 1 });
    }

    squish() {
        console.log('Squish');
    }

    getMidpoint() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
        };
    }
}

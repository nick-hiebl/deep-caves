const WALKING_SPEED = 180 / 1000;
const WALKING_ACCEL = 2 / 1000;

class Walker extends Enemy {
    constructor(...args) {
        super(...args);

        this.hp = 5;

        this.isNonPhysical = false;
        this.facing = 'left';
    }

    updateVelocities(frameDuration, room, _playerPosition) {
        /** Do something */
        this.yVelocity += GRAVITY * frameDuration;

        const standingSolid = { x: this.actor.x, y: this.actor.y + this.actor.height, width: this.actor.width, height: 1 };

        if (!room.solids.some(solid => solid.isCollidable && overlaps(solid, standingSolid))) {
            /** Wait */
            this.xVelocity = approach(0, this.xVelocity, WALKING_ACCEL / 2);
        }

        if (this.facing === 'left') {
            if (this.canMoveLeft(room)) {
                this.xVelocity = approach(-WALKING_SPEED, this.xVelocity, WALKING_ACCEL);
            } else if (this.canMoveRight(room)) {
                this.facing = 'right';
                this.xVelocity = approach(0, this.xVelocity, WALKING_ACCEL);
            }
        } else {
            /** Facing right case */
            if (this.canMoveRight(room)) {
                this.xVelocity = approach(WALKING_SPEED, this.xVelocity, WALKING_ACCEL);
            } else if (this.canMoveLeft(room)) {
                this.facing = 'left';
                this.xVelocity = approach(0, this.xVelocity, WALKING_ACCEL);
            }
        }
    }

    canMoveLeft(room) {
        /** Currently taking for granted that we're on the ground. */

        const groundSolid = { x: this.actor.x - this.actor.width / 2, y: this.actor.y + this.actor.height, width: this.actor.width / 4, height: 1 };
        const spaceSolid = { x: this.actor.x - this.actor.width, y: this.actor.y, height: this.actor.height, width: this.actor.width };

        return room.solids.some(solid => solid.isCollidable && !solid.isDroppable && overlaps(solid, groundSolid))
            && room.solids.every(solid => !solid.isCollidable || !overlaps(solid, spaceSolid));
    }

    canMoveRight(room) {
        /** Currently taking for granted that we're on the ground. */

        const groundSolid = { x: this.actor.x + this.actor.width / 4 * 5, y: this.actor.y + this.actor.height, width: this.actor.width / 4, height: 1 };
        const spaceSolid = { x: this.actor.x + this.actor.width, y: this.actor.y, height: this.actor.height, width: this.actor.width };

        return room.solids.some(solid => solid.isCollidable && !solid.isDroppable && overlaps(solid, groundSolid))
            && room.solids.every(solid => !solid.isCollidable || solid.isDroppable || !overlaps(solid, spaceSolid));
    }

    applyDamage(box, impulse) {
        super.applyDamage(box, impulse);
        this.yVelocity -= 0.3;
    }
}

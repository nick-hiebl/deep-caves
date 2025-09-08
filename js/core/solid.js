class Solid {
    constructor(x, y, width, height, config = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.isCollidable = true;
        this.isDroppable = config.isDroppable ?? false;

        this.xRemainder = 0;
        this.yRemainder = 0;
    }

    move(x, y, actors, solids) {
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

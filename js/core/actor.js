const STEP_SIZE = 4;

class Actor {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.xRemainder = 0;
        this.yRemainder = 0;
    }

    moveX(amount, onCollide, solids) {
        this.xRemainder += amount;
        let move = Math.round(this.xRemainder);

        if (move !== 0) {
            this.xRemainder -= move;
            const sign = move > 0 ? 1 : -1;

            while (move !== 0) {
                this.x += sign;
                move -= sign;

                /** Backtrack one step on collision and return */
                if (this.collideAt(solids)) {
                    this.x -= sign;
                    onCollide();
                    break;
                }
            }
        }
    }

    moveY(amount, onCollide, solids) {
        this.yRemainder += amount;
        let move = Math.round(this.yRemainder);

        if (move !== 0) {
            this.yRemainder -= move;
            const sign = move > 0 ? 1 : -1;

            /** Move in STEP_SIZE chunks */
            while (Math.abs(move) > STEP_SIZE) {
                this.y += sign * STEP_SIZE;
                move -= sign * STEP_SIZE;

                /** Upon collision, backtrack until no longer colliding */
                if (this.collideAt(solids)) {
                    while (this.collideAt(solids)) {
                        this.y -= sign;
                    }
                    onCollide();
                    return;
                }
            }

            /** Process leftovers if any */
            while (move !== 0) {
                this.y += sign;
                move -= sign;

                /** Backtrack one step on collision and return */
                if (this.collideAt(solids)) {
                    this.y -= sign;
                    onCollide();
                    break;
                }
            }
        }
    }

    collideAt(solids) {
        return solids.some(solid => solid.isCollidable && overlaps(this, solid));
    }

    isRiding(solid) {
        return isPointInside(solid, this.x, this.y + this.height)
            || isPointInside(solid, this.x + this.width - 1, this.y + this.height);
    }
    
    squish() {
        console.log('Squish');
    }
}

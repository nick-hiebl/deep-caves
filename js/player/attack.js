const SWORD_SWOOSH = new Image();
SWORD_SWOOSH.src = './img/sword_slash.png';

const ATTACK_HEIGHT = 36;
const ATTACK_WIDTH = 56;
const ATTACK_SCALE = 2;

const KNOCKBACK_AMOUNT = 0.7;

class Attack {
    constructor(facing) {
        this.facing = facing;

        this.box = {
            width: ATTACK_WIDTH * ATTACK_SCALE,
            height: ATTACK_HEIGHT * ATTACK_SCALE,
            x: facing === 'left' ? -ATTACK_WIDTH * ATTACK_SCALE * 3 / 4 : -ATTACK_WIDTH * ATTACK_SCALE * 1 / 4,
            y: -ATTACK_HEIGHT * ATTACK_SCALE / 2,
        };

        this.interactedWith = new Set();
    }

    prePlayerDraw(ctx, relativePosition, attackTransparency) {
        const attackSrcX = this.facing === 'left' ? 0 : ATTACK_WIDTH;
        const attackDestX = relativePosition.x + this.box.x;
        const attackDestY = relativePosition.y + this.box.y;

        ctx.globalAlpha = attackTransparency;
        ctx.drawImage(
            SWORD_SWOOSH,
            /** Src parameters */
            attackSrcX,
            0,
            ATTACK_WIDTH,
            ATTACK_HEIGHT / 2,
            /** Destination parameters */
            attackDestX,
            attackDestY,
            ATTACK_WIDTH * ATTACK_SCALE,
            ATTACK_HEIGHT * ATTACK_SCALE / 2,
        );
        ctx.globalAlpha = 1;
    }

    postPlayerDraw(ctx, relativePosition, attackTransparency) {
        const attackSrcX = this.facing === 'left' ? 0 : ATTACK_WIDTH;
        const attackDestX = relativePosition.x + this.box.x;
        const attackDestY = relativePosition.y + this.box.y;

        ctx.globalAlpha = attackTransparency;
        ctx.drawImage(
            SWORD_SWOOSH,
            /** Src parameters */
            attackSrcX,
            ATTACK_HEIGHT / 2,
            ATTACK_WIDTH,
            ATTACK_HEIGHT / 2,
            /** Destination parameters */
            attackDestX,
            attackDestY + ATTACK_HEIGHT * ATTACK_SCALE / 2,
            ATTACK_WIDTH * ATTACK_SCALE,
            ATTACK_HEIGHT * ATTACK_SCALE / 2,
        );
        ctx.globalAlpha = 1;

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'pink';

            ctx.strokeRect(relativePosition.x + this.box.x, relativePosition.y + this.box.y, this.box.width, this.box.height);
        }
    }

    getBox(base) {
        return {
            x: base.x + this.box.x,
            y: base.y + this.box.y,
            width: this.box.width,
            height: this.box.height,
        };
    }

    interactWithEnemy(basePosition, enemy) {
        if (this.interactedWith.has(enemy)) {
            return;
        }
        const box = this.getBox(basePosition);

        if (overlaps(box, enemy.actor)) {
            enemy.xVelocity += this.facing === 'left' ? -KNOCKBACK_AMOUNT : KNOCKBACK_AMOUNT;
            this.interactedWith.add(enemy);
        }
    }
}

const WALL_THICKNESS = 40;

const ROOM_SCALE_WIDTH = 1280;
const ROOM_SCALE_HEIGHT = 720;

const GAP_SIZE = WALL_THICKNESS * 6;

const EPSILON = 0.01;

class Room {
    constructor(x, y, width, height, color = 'blue') {
        /** Room setup */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.color = color;

        /** Inner room setup */
        this.solids = generateRoom(x, y);
        this.interactive = new MovingPlatform(0, 280, 200, 40);
        this.solids.push(this.interactive.solid);

        /** Player setup */
        this.playerState = new PlayerState(0.4 * ROOM_SCALE_WIDTH, 0.4 * ROOM_SCALE_HEIGHT);

        this.enemies = [
            new Enemy(ROOM_SCALE_WIDTH, ROOM_SCALE_HEIGHT),
        ];
    }

    draw(ctx, canvas, mousePosition, interpolationFactor) {
        /** Blank background */
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        /** Outer boundaries */
        ctx.fillStyle = this.color;

        for (const solid of this.solids) {
            ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }

        /** Draw enemies */
        this.enemies.forEach(enemy => {
            enemy.draw(ctx);
        });

        /** Draw player */
        ctx.fillStyle = 'white';
        this.playerState.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    update(mousePosition, keyboardState, frameDuration, onRoomChange) {
        this.interactive.update(frameDuration, [this.playerState.actor], this.solids);

        this.enemies.forEach(enemy => {
            enemy.update(frameDuration, this.solids, this.playerState.actor.getMidpoint());
        });

        this.playerState.update(mousePosition, keyboardState, frameDuration, this.solids, this.enemies);

        this.enemies = this.enemies.filter(enemy => enemy.alive);

        this.validateLeavingRoom(onRoomChange);
    }

    validateLeavingRoom(onRoomChange) {
        const playerMidpoint = this.playerState.actor.getMidpoint();
        if (playerMidpoint.x > ROOM_SCALE_WIDTH) {
            onRoomChange(this.x + 1, this.y);
        } else if (playerMidpoint.x < 0) {
            onRoomChange(this.x - 1, this.y);
        } else if (playerMidpoint.y > ROOM_SCALE_HEIGHT) {
            onRoomChange(this.x, this.y + 1);
        } else if (playerMidpoint.y < 0) {
            onRoomChange(this.x, this.y - 1);
        }
    }

    drawForMap(mapCtx) {
        mapCtx.fillStyle = this.color;

        for (const solid of this.solids) {
            mapCtx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }
    }
}

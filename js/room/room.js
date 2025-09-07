const WALL_THICKNESS = 40;

const ROOM_SCALE_WIDTH = 1280;
const ROOM_SCALE_HEIGHT = 720;

const EPSILON = 0.01;

const generateRoom = () => {
    const solids = [];

    solids.push(new Solid(0, 0, ROOM_SCALE_WIDTH, WALL_THICKNESS));
    solids.push(new Solid(0, ROOM_SCALE_HEIGHT - WALL_THICKNESS, ROOM_SCALE_WIDTH, WALL_THICKNESS));
    solids.push(new Solid(0, 0, WALL_THICKNESS, ROOM_SCALE_HEIGHT));
    solids.push(new Solid(ROOM_SCALE_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_SCALE_HEIGHT));

    for (let y = 0; y < ROOM_SCALE_HEIGHT; y += WALL_THICKNESS) {
        for (let x = 0; x < ROOM_SCALE_WIDTH; x += WALL_THICKNESS) {
            const isXWall = x === 0 || x + WALL_THICKNESS === ROOM_SCALE_WIDTH;
            const isYWall = y === 0 || y + WALL_THICKNESS === ROOM_SCALE_HEIGHT;

            if (!(isXWall || isYWall) && Math.random() < 0.02) {
                solids.push(new Solid(x, y, WALL_THICKNESS, WALL_THICKNESS));
            }
        }
    }

    return solids;
};

class Room {
    constructor(x, y, width, height) {
        /** Room setup */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.color = 'blue';

        /** Inner room setup */
        this.solids = generateRoom();
        this.interactive = new MovingPlatform(0, 640, 200, 40);
        this.solids.push(this.interactive.solid);

        /** Player setup */
        this.playerState = new PlayerState(0.4 * ROOM_SCALE_WIDTH, 0.4 * ROOM_SCALE_HEIGHT);

        this.enemies = [
            new Enemy(width, height),
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

    update(mousePosition, keyboardState, frameDuration) {
        this.interactive.update(frameDuration, [this.playerState.actor], this.solids);

        this.enemies.forEach(enemy => {
            enemy.update(frameDuration, this.solids, this.playerState);
        });

        this.playerState.update(mousePosition, keyboardState, frameDuration, this.solids);
    }
}

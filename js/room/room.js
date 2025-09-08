const WALL_THICKNESS = 40;

const ROOM_SCALE_WIDTH = 1280;
const ROOM_SCALE_HEIGHT = 720;

const GAP_SIZE = WALL_THICKNESS * 6;

const EPSILON = 0.01;

const createSolid = (args, config) => {
    const x = args.x ?? args.left;
    const y = args.y ?? args.top;
    const width = args.width ?? args.right - x;
    const height = args.height ?? args.bottom - y;

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        throw new Error('Invalid parameters to create solid!');
    }

    return new Solid(x, y, width, height, config);
}

const generateRoom = () => {
    const solids = [];

    const gapLeft = ROOM_SCALE_WIDTH / 2 - GAP_SIZE / 2;
    const gapRight = gapLeft + GAP_SIZE;

    const gapTop = Math.floor(ROOM_SCALE_HEIGHT * 0.75 - GAP_SIZE / 2);
    const gapBottom = gapTop + GAP_SIZE;

    /** Top */
    solids.push(createSolid({ left: 0, right: gapLeft, y: 0, height: WALL_THICKNESS }));
    solids.push(createSolid({ left: gapRight, right: ROOM_SCALE_WIDTH, y: 0, height: WALL_THICKNESS }));
    /** Bottom */
    solids.push(createSolid({ left: 0, right: gapLeft, y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));
    solids.push(createSolid({ left: gapRight, right: ROOM_SCALE_WIDTH, y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));
    /** Left */
    solids.push(createSolid({ x: 0, width: WALL_THICKNESS, top: 0, bottom: gapTop }));
    solids.push(createSolid({ x: 0, width: WALL_THICKNESS, top: gapBottom, bottom: ROOM_SCALE_HEIGHT }));
    /** Right */
    solids.push(createSolid({ x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS, top: 0, bottom: gapTop }));
    solids.push(createSolid({ x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS, top: gapBottom, bottom: ROOM_SCALE_HEIGHT }));

    for (let y = 0; y < ROOM_SCALE_HEIGHT; y += WALL_THICKNESS) {
        for (let x = ROOM_SCALE_WIDTH * 3 / 4; x < ROOM_SCALE_WIDTH; x += WALL_THICKNESS) {
            const isXWall = x === 0 || x + WALL_THICKNESS === ROOM_SCALE_WIDTH;
            const isYWall = y === 0 || y + WALL_THICKNESS === ROOM_SCALE_HEIGHT;

            if (!(isXWall || isYWall) && Math.random() < 0.02) {
                solids.push(new Solid(x, y, WALL_THICKNESS, WALL_THICKNESS));
            }
        }
    }

    solids.push(createSolid(
        { left: gapLeft - GAP_SIZE, width: GAP_SIZE, top: 420, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));
    solids.push(createSolid(
        { left: gapLeft - GAP_SIZE, width: GAP_SIZE, top: 570, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));

    solids.push(createSolid(
        { left: gapLeft, right: gapRight, top: 140, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));

    solids.push(createSolid(
        { left: gapLeft, right: gapRight, top: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));

    return solids;
};

class Room {
    constructor(x, y, width, height, color = 'blue') {
        /** Room setup */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.color = color;

        /** Inner room setup */
        this.solids = generateRoom();
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
}

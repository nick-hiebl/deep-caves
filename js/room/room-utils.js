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

const generateRoom = (x, y) => {
    const solids = [];

    const gapLeft = ROOM_SCALE_WIDTH / 2 - GAP_SIZE / 2;
    const gapRight = gapLeft + GAP_SIZE;

    const gapTop = Math.floor(ROOM_SCALE_HEIGHT * 0.75 - GAP_SIZE / 2);
    const gapBottom = gapTop + GAP_SIZE;

    /** Top */
    if (y >= 2 || (x === 0 && y === 1)) {
        solids.push(createSolid({ left: 0, right: gapLeft, y: 0, height: WALL_THICKNESS }));
        solids.push(createSolid({ left: gapRight, right: ROOM_SCALE_WIDTH, y: 0, height: WALL_THICKNESS }));
    } else {
        solids.push(createSolid({ left: 0, right: ROOM_SCALE_WIDTH, top: 0, height: WALL_THICKNESS}));
    }

    /** Bottom */
    solids.push(createSolid({ left: 0, right: gapLeft, y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));
    solids.push(createSolid({ left: gapRight, right: ROOM_SCALE_WIDTH, y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));

    if (y >= 1) {
        /** Left */
        solids.push(createSolid({ x: 0, width: WALL_THICKNESS, top: 0, bottom: gapTop }));
        solids.push(createSolid({ x: 0, width: WALL_THICKNESS, top: gapBottom, bottom: ROOM_SCALE_HEIGHT }));
        /** Right */
        solids.push(createSolid({ x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS, top: 0, bottom: gapTop }));
        solids.push(createSolid({ x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS, top: gapBottom, bottom: ROOM_SCALE_HEIGHT }));
    } else {
        solids.push(createSolid({ x: 0, width: WALL_THICKNESS, top: 0, bottom: ROOM_SCALE_HEIGHT }));
        /** Right */
        solids.push(createSolid({ x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS, top: 0, bottom: ROOM_SCALE_HEIGHT }));
    }

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

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

const generateRoom = (x, y, doors) => {
    const solids = [];

    const gapLeft = ROOM_SCALE_WIDTH / 2 - GAP_SIZE / 2;
    const gapRight = gapLeft + GAP_SIZE;

    const gapTop = Math.floor(ROOM_SCALE_HEIGHT * 0.75 - GAP_SIZE / 2);
    const gapBottom = gapTop + GAP_SIZE;

    /** Top */
    const topStarts = [0].concat(doors.top.map(name => GAPS[name][1]));
    const topEnds = doors.top.map(name => GAPS[name][0]).concat(ROOM_SCALE_WIDTH);
    topStarts.forEach((left, index) => {
        solids.push(createSolid({ left, right: topEnds[index], y: 0, height: WALL_THICKNESS }));
    });

    /** Bottom */
    const bottomStarts = [0].concat(doors.bottom.map(name => GAPS[name][1]));
    const bottomEnds = doors.bottom.map(name => GAPS[name][0]).concat(ROOM_SCALE_WIDTH);
    bottomStarts.forEach((left, index) => {
        solids.push(createSolid({ left, right: bottomEnds[index], y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));
    });
    doors.bottom.forEach(name => {
        solids.push(createSolid(
            { left: GAPS[name][0], right: GAPS[name][1], top: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS / 4 },
            { isDroppable: true },
        ));
    });

    /** Left */
    const leftStarts = [0].concat(doors.left.map(name => GAPS[name][1]));
    const leftEnds = doors.left.map(name => GAPS[name][0]).concat(ROOM_SCALE_HEIGHT);
    leftStarts.forEach((top, index) => {
        solids.push(createSolid({ top, bottom: leftEnds[index], left: 0, width: WALL_THICKNESS }));
    });

    /** Right */
    const rightStarts = [0].concat(doors.right.map(name => GAPS[name][1]));
    const rightEnds = doors.right.map(name => GAPS[name][0]).concat(ROOM_SCALE_HEIGHT);
    rightStarts.forEach((top, index) => {
        solids.push(createSolid({ top, bottom: rightEnds[index], left: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS }));
    });

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

    return solids;
};

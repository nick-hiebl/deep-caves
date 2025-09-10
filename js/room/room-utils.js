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

const getGapNames = (gapMap) => {
    return Object.keys(gapMap).filter(key => gapMap[key]);
};

const generateRoom = (x, y, doors) => {
    const solids = [];
    const blockers = [];

    const gapLeft = ROOM_SCALE_WIDTH / 2 - GAP_SIZE / 2;
    const gapRight = gapLeft + GAP_SIZE;

    /** Top */
    const topStarts = [0].concat(getGapNames(doors.top).map(name => GAPS[name][1]));
    const topEnds = getGapNames(doors.top).map(name => GAPS[name][0]).concat(ROOM_SCALE_WIDTH);
    topStarts.forEach((left, index) => {
        solids.push(createSolid({ left, right: topEnds[index], y: 0, height: WALL_THICKNESS }));
    });
    getGapNames(doors.top).map(name => GAPS[name]).forEach(([left, right]) => {
        const newSolid = createSolid({ left, right, y: 0, height: WALL_THICKNESS });
        blockers.push(newSolid);
    });

    /** Bottom */
    const bottomStarts = [0].concat(getGapNames(doors.bottom).map(name => GAPS[name][1]));
    const bottomEnds = getGapNames(doors.bottom).map(name => GAPS[name][0]).concat(ROOM_SCALE_WIDTH);
    bottomStarts.forEach((left, index) => {
        solids.push(createSolid({ left, right: bottomEnds[index], y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS }));
    });
    getGapNames(doors.bottom).forEach(name => {
        solids.push(createSolid(
            { left: GAPS[name][0], right: GAPS[name][1], top: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS / 4 },
            { isDroppable: true },
        ));
    });
    getGapNames(doors.bottom).map(name => GAPS[name]).forEach(([left, right]) => {
        const newSolid = createSolid({ left, right, y: ROOM_SCALE_HEIGHT - WALL_THICKNESS, height: WALL_THICKNESS });
        blockers.push(newSolid);
    });

    /** Left */
    const leftStarts = [0].concat(getGapNames(doors.left).map(name => GAPS[name][1]));
    const leftEnds = getGapNames(doors.left).map(name => GAPS[name][0]).concat(ROOM_SCALE_HEIGHT);
    leftStarts.forEach((top, index) => {
        solids.push(createSolid({ top, bottom: leftEnds[index], left: 0, width: WALL_THICKNESS }));
    });
    getGapNames(doors.left).map(name => GAPS[name]).forEach(([top, bottom]) => {
        const newSolid = createSolid({ top, bottom, x: 0, width: WALL_THICKNESS });
        blockers.push(newSolid);
    });

    /** Right */
    const rightStarts = [0].concat(getGapNames(doors.right).map(name => GAPS[name][1]));
    const rightEnds = getGapNames(doors.right).map(name => GAPS[name][0]).concat(ROOM_SCALE_HEIGHT);
    rightStarts.forEach((top, index) => {
        solids.push(createSolid({ top, bottom: rightEnds[index], left: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS }));
    });
    getGapNames(doors.right).map(name => GAPS[name]).forEach(([top, bottom]) => {
        const newSolid = createSolid({ top, bottom, x: ROOM_SCALE_WIDTH - WALL_THICKNESS, width: WALL_THICKNESS });
        blockers.push(newSolid);
    });

    /** Add left ladder */
    solids.push(createSolid(
        { left: gapLeft - GAP_SIZE, width: GAP_SIZE, top: 420, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));
    solids.push(createSolid(
        { left: gapLeft - GAP_SIZE, width: GAP_SIZE, top: 570, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));
    /** Add top platform */
    solids.push(createSolid(
        { left: gapLeft, right: gapRight, top: 140, height: WALL_THICKNESS / 4 },
        { isDroppable: true },
    ));

    return blockers.map(blocker => {
        blocker.blocker = true;
        blocker.isCollidable = false;
        return blocker;
    }).concat(solids);
};

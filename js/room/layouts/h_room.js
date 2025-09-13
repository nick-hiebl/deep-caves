class HRoom extends Room {
    getDoorwayChance() {
        return 0;
    }

    static getDoorArrangement() {
        return {
            left: {
                high: false,
                medium: false,
                low: false
            },
            right: {
                high: false,
                medium: false,
                low: false,
            },
            bottom: {
                left: true,
                center: false,
                right: true,
            },
            top: {
                left: true,
                center: false,
                right: true,
            },
        };
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { blockers } = generateRoomForDoors(this.doors);
        this.solids = []
            .concat(blockers)
            .concat(
                new Solid(0, 0, 80, ROOM_SCALE_HEIGHT),
                new Solid(ROOM_SCALE_WIDTH - 80, 0, 80, ROOM_SCALE_HEIGHT),
                new Solid(280, 0, 720, 260),
                new Solid(280, 460, 720, 260),
                /** Lower left leg */
                new Solid(80, ROOM_SCALE_HEIGHT - 40, 200, 10, { isDroppable: true }),
                new Solid(120, 570, 120, 10, { isDroppable: true }),
                new Solid(80, 460, 200, 10, { isDroppable: true }),
                /** Upper left leg */
                new Solid(80, 120, 200, 10, { isDroppable: true }),
                new Solid(80, 250, 200, 10, { isDroppable: true }),
                new Solid(80, 355, 100, 10, { isDroppable: true }),
                /** Lower right leg */
                new Solid(1000, ROOM_SCALE_HEIGHT - 40, 200, 10, { isDroppable: true }),
                new Solid(1040, 570, 120, 10, { isDroppable: true }),
                new Solid(1000, 460, 200, 10, { isDroppable: true }),
                /** Upper right leg */
                new Solid(1000, 120, 200, 10, { isDroppable: true }),
                new Solid(1000, 250, 200, 10, { isDroppable: true }),
                new Solid(1100, 355, 100, 10, { isDroppable: true }),
            );
    }
}

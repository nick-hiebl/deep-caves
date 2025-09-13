class TRoom extends Room {
    getDoorwayChance() {
        return 0;
    }

    static getDoorArrangement() {
        return {
            left: {
                high: true,
                medium: false,
                low: false,
            },
            right: {
                high: true,
                medium: false,
                low: false,
            },
            bottom: {
                left: false,
                center: true,
                right: false,
            },
            top: {},
        };
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers } = generateRoomForDoors(this.doors);
        this.solids = solids
            .concat(blockers)
            .concat(
                new Solid(0, 240, 440, ROOM_SCALE_HEIGHT - 240),
                new Solid(840, 240, ROOM_SCALE_WIDTH - 840, ROOM_SCALE_HEIGHT - 240),
                new Solid(440, 240, 400, 10, { isDroppable: true }),
                new Solid(440, 380, 400, 10, { isDroppable: true }),
                new Solid(440, 520, 400, 10, { isDroppable: true }),
            )
            .concat(
                ...[
                    this.doors.top['left'] ? new Solid(100, 110, 160, 10, { isDroppable: true }) : undefined,
                    this.doors.top['center'] ? new Solid(560, 110, 160, 10, { isDroppable: true }) : undefined,
                    this.doors.top['right'] ? new Solid(1020, 110, 160, 10, { isDroppable: true }) : undefined,
                ].filter(x => x),
            );
    }
}

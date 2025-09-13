class LRoom extends Room {
    getDoorwayChance() {
        return 0.1;
    }

    static getDoorArrangement() {
        return {
            left: {},
            right: {
                high: false,
                medium: false,
                low: true,
            },
            bottom: {},
            top: {
                left: true,
                center: false,
                right: false,
            },
        };
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers } = generateRoomForDoors(this.doors);
        this.solids = solids
            .concat(blockers)
            .concat(
                new Solid(380, 0, ROOM_SCALE_WIDTH - 380, 450),
                new Solid(40, 110, 340, 10, { isDroppable: true }),
                new Solid(40, 240, 340, 10, { isDroppable: true }),
                new Solid(this.doors.left['center'] ? 160: 40, 340, this.doors.left['center'] ? 220 : 340, 10, { isDroppable: true }),
                new Solid(40, 440, 340, 10, { isDroppable: true }),
                new Solid(40, this.doors.left['low'] ? 550 : 540, 240, 10, { isDroppable: true }),
            );
    }
}

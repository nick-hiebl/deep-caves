class PitRoom extends Room {
    getDoorwayChance() {
        return 0.1;
    }

    static getDoorArrangement() {
        return {
            left: {
                high: false,
                medium: false,
                low: false,
            },
            right: {
                high: false,
                medium: false,
                low: false,
            },
            bottom: {
                high: false,
                medium: false,
                low: false,
            },
            top: {
                left: false,
                center: true,
                right: false,
            },
        };
    }

    static isValidAt(x, y) {
        return true;
        // return y >= 3 && x !== 0;
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers } = generateRoomForDoors(this.doors);
        this.solids = solids
            .concat(blockers)
            .concat(
                new Solid(320, 160, 920, 40),
                new Solid(840, 0, 440, 200),
                new Solid(0, 0, 80, ROOM_SCALE_HEIGHT),
                new Solid(ROOM_SCALE_WIDTH - 80, 0, 80, ROOM_SCALE_HEIGHT),
                new Solid(0, ROOM_SCALE_HEIGHT - 80, ROOM_SCALE_WIDTH, 80),
                new Solid(80, 160, 240, 10, { isDroppable: true }),
            );

        this.enemies = [
            new SpitBoss(780, ROOM_SCALE_HEIGHT - 80),
        ];
    }

    onAllEnemiesCleared() {
        super.onAllEnemiesCleared();

        this.solids = this.solids.concat(
            ...[320, 480].map(y =>
                new Solid(80, y, 240, 10, { isDroppable: true }),
            ),
        );
    }
}

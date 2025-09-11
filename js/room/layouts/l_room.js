class LRoom extends Room {
    /** Default room constructor works for any door arrangement */
    static areDoorsOk(setDoors = {}) {
        if (setDoors.top?.center || setDoors.top?.right || setDoors.right?.high || setDoors.right?.medium) {
            return false;
        }

        return true;
    }

    /** Randomise un-specified doors */
    configureAllDoors() {
        HORIZONTAL_DOOR_KEYS.forEach(key => {
            if (this.doors.left[key] === undefined) {
                this.doors.left[key] = Math.random() < 0.5;
            }
            if (key === 'low' && this.doors.right[key] === undefined) {
                this.doors.right[key] = Math.random() < 0.5;
            }
        });
        VERTICAL_DOOR_KEYS.forEach(key => {
            if (key === 'left' && this.doors.top[key] === undefined) {
                this.doors.top[key] = Math.random() < 0.5;
            }
            if (this.doors.bottom[key] === undefined) {
                this.doors.bottom[key] = Math.random() < 0.5;
            }
        });
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers } = generateRoomForDoors(this.doors);
        this.solids = solids
            .concat(blockers)
            .concat(new Solid(ROOM_SCALE_WIDTH / 2, 0, ROOM_SCALE_WIDTH / 2, ROOM_SCALE_HEIGHT / 2));
    }
}

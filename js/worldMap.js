class WorldMap {
    constructor() {
        this.lastRoomIndex = { x: 0, y: 0 };

        this.map = {};
        this.x = 0;
        this.y = 0;
        this.currentIndex = this.index(0, 0);

        const room = new Room(0, 0, 1, 1);
        
        this.map[this.index(0, 0)] = room;
    }

    index(x, y) {
        return `${x},${y}`;
    }

    getCurrentRoom() {
        return this.map[this.currentIndex];
    }

    getPreviousRoom() {
        return this.map[this.index(this.lastRoomIndex.x, this.lastRoomIndex.y)];
    }

    hasRoom(x, y) {
        const index = this.index(x, y);

        return index in this.map;
    }

    enterRoom(x, y) {
        this.lastRoomIndex = { x: this.x, y: this.y };

        this.x = x;
        this.y = y;
        this.currentIndex = this.index(x, y);
    }

    addRoom(room) {
        if (this.map[this.currentIndex]) {
            console.error('Adding room where we already have one!');
        }

        this.map[this.currentIndex] = room;
    }
}

class WorldMap {
    constructor() {
        this.map = {};
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
}

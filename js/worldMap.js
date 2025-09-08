const MAP_ROOM_WIDTH = 128;
const MAP_ROOM_HEIGHT = 72;
const DEFAULT_MAP_WIDTH = 9;
const DEFAULT_MAP_HEIGHT = 6;

const MAP_ROOM_SCALE = 1 / 10;

const CURRENT_ROOM_BORDER = 2;

/** Amount to jump canvas size up by when re-drawing. */
const INCREMENT_BY = 4;

class WorldMap {
    constructor() {
        this.lastRoomIndex = { x: 0, y: 0 };

        this.map = {};
        this.x = 0;
        this.y = 0;
        this.currentIndex = this.index(0, 0);

        this.minX = 0;
        this.minY = 0;

        const room = new Room(0, 0, 1, 1);
        
        this.map[this.index(0, 0)] = room;

        this.createNewCanvas(0, 0, 0, 0);

        this.redrawWorldMap();
    }

    createNewCanvas(minX, maxX, minY, maxY) {
        const cols = Math.max(DEFAULT_MAP_WIDTH, maxX - minX + 1 + INCREMENT_BY);
        const rows = Math.max(DEFAULT_MAP_HEIGHT, maxY - minY + 1 + INCREMENT_BY);

        this.canvas = new OffscreenCanvas(cols * MAP_ROOM_WIDTH, rows * MAP_ROOM_HEIGHT);
        this.ctx = this.canvas.getContext('2d');
    }

    redrawWorldMap() {
        let maxX = 0, maxY = 0;

        for (const room of Object.values(this.map)) {
            this.minX = Math.min(this.minX, room.x);
            maxX = Math.max(maxX, room.x);
            this.minY = Math.min(this.minY, room.y);
            maxY = Math.max(maxY, room.y);
        }

        if (maxX - this.minX + 1 > this.canvas.width / MAP_ROOM_WIDTH || maxY - this.minY + 1 > this.canvas.height / MAP_ROOM_HEIGHT) {
            this.createNewCanvas(this.minX, maxX, this.minY, maxY);
        }

        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const room of Object.values(this.map)) {
            this.ctx.save();
            this.ctx.translate((room.x - this.minX) * MAP_ROOM_WIDTH, (room.y - this.minY) * MAP_ROOM_HEIGHT);
            this.ctx.scale(MAP_ROOM_SCALE, MAP_ROOM_SCALE);

            room.drawForMap(this.ctx);

            this.ctx.restore();
        }
    }

    drawMapToScreen(ctx, x, y, width, height) {
        const drawWidth = Math.min(width, this.canvas.width);
        const drawHeight = Math.min(height, this.canvas.height);

        const xOffset = (-this.minX + this.x + 1/2) * MAP_ROOM_WIDTH - width / 2;

        ctx.drawImage(this.canvas, xOffset, 0, drawWidth, drawHeight, x, y, drawWidth, drawHeight);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = CURRENT_ROOM_BORDER;
        ctx.strokeRect(
            -xOffset + (this.x - this.minX + 1/2) * MAP_ROOM_WIDTH - CURRENT_ROOM_BORDER,
            y + this.y * MAP_ROOM_HEIGHT - CURRENT_ROOM_BORDER,
            MAP_ROOM_WIDTH + CURRENT_ROOM_BORDER * 2,
            MAP_ROOM_HEIGHT + CURRENT_ROOM_BORDER * 2,
        );
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

        this.redrawWorldMap();
    }

    addRoom(room) {
        if (this.map[this.currentIndex]) {
            throw new Error('Adding room where we already have one!');
        }

        this.map[this.currentIndex] = room;

        this.redrawWorldMap();
    }
}

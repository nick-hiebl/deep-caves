import { insetRect, produceRect, randint, rectToCtxArgs } from './core/math';
import { GhostRoom } from './room/layouts/ghost_room';
import { HRoom } from './room/layouts/h_room';
import { LRoom } from './room/layouts/l_room';
import { PitRoom } from './room/layouts/pit_room';
import { TRoom } from './room/layouts/t_room';
import { Room, type DoorsMap } from './room/room';

const MAP_ROOM_WIDTH = 128;
const MAP_ROOM_HEIGHT = 72;
const DEFAULT_MAP_WIDTH = 9;
const DEFAULT_MAP_HEIGHT = 6;

const MAP_ROOM_SCALE = 1 / 10;

/** Amount to jump canvas size up by when re-drawing. */
const INCREMENT_BY = 4;

export class WorldMap {
    lastRoomIndex: { x: number; y: number };
    map: Record<string, Room>;

    x: number;
    y: number;
    currentIndex: string;

    minX: number;
    minY: number;

    canvas: OffscreenCanvas;
    ctx: OffscreenCanvasRenderingContext2D;

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

        const cols = Math.max(DEFAULT_MAP_WIDTH);
        const rows = Math.max(DEFAULT_MAP_HEIGHT);

        this.canvas = new OffscreenCanvas(cols * MAP_ROOM_WIDTH, rows * MAP_ROOM_HEIGHT);
        const ctx = this.canvas.getContext('2d');

        if (!ctx) {
            throw Error('Could not construct canvas');
        }

        this.ctx = ctx;

        this.redrawWorldMap();
    }

    createNewCanvas(minX: number, maxX: number, minY: number, maxY: number) {
        const cols = Math.max(DEFAULT_MAP_WIDTH, maxX - minX + 1 + INCREMENT_BY);
        const rows = Math.max(DEFAULT_MAP_HEIGHT, maxY - minY + 1 + INCREMENT_BY);

        this.canvas = new OffscreenCanvas(cols * MAP_ROOM_WIDTH, rows * MAP_ROOM_HEIGHT);

        const ctx = this.canvas.getContext('2d');

        if (!ctx) {
            throw Error('Could not construct canvas');
        }

        this.ctx = ctx;
    }

    getNeighboringDoors(x: number, y: number) {
        return {
            right: { ...this.map[this.index(x + 1, y)]?.doors?.left },
            left: { ...this.map[this.index(x - 1, y)]?.doors?.right },
            top: { ...this.map[this.index(x, y - 1)]?.doors?.bottom },
            bottom: { ...this.map[this.index(x, y + 1)]?.doors?.top },
        };
    }

    generateRoomChoices(x: number, y: number, suggestedDoors: Partial<DoorsMap> = {}) {
        const makeColor = () => `hsl(${randint(0, 360)}, 60%, 60%)`;

        const cloneDoors = () => ({
            left: { ...(suggestedDoors.left ?? {}) },
            right: { ...(suggestedDoors.right ?? {}) },
            top: { ...(suggestedDoors.top ?? {}) },
            bottom: { ...(suggestedDoors.bottom ?? {}) },
        });

        const CONSTRUCTORS = [GhostRoom, HRoom, LRoom, TRoom, PitRoom];

        const checkDoors = cloneDoors();

        const acceptableConstructors = CONSTRUCTORS.filter(Class =>
            Class.isValidAt(x, y) && Class.areDoorsOk(checkDoors),
        );

        /** TODO: Shuffle constructors */

        /** Pad with auto-generators */
        acceptableConstructors.push(Room, Room, Room);

        const choices = [];

        for (let i = 0; i < 3; i++) {
            const RoomType = acceptableConstructors.shift();

            if (!RoomType) {
                throw new Error('Could not find enough rooms');
            }

            /** Must re-compute neighboring doors for each as otherwise each instance will be shared. */
            choices.push(new RoomType(x, y, 1, 1, makeColor(), cloneDoors()));
        }

        return choices;
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

    drawMapToScreen(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
        const CURRENT_ROOM_BORDER = 2;
        const CROSSHAIR_LENGTH = 10;

        const drawWidth = Math.min(width, this.canvas.width);
        const drawHeight = Math.min(height, this.canvas.height);

        const xOffset = (-this.minX + this.x + 1 / 2) * MAP_ROOM_WIDTH - width / 2;

        ctx.drawImage(this.canvas, xOffset, 0, drawWidth, drawHeight, x, y, drawWidth, drawHeight);

        ctx.fillStyle = 'white';
        const rect = insetRect({
            x: -xOffset + (this.x - this.minX + 1 / 2) * MAP_ROOM_WIDTH,
            y: y + this.y * MAP_ROOM_HEIGHT,
            width: MAP_ROOM_WIDTH,
            height: MAP_ROOM_HEIGHT,
        }, -CURRENT_ROOM_BORDER);
        ctx.fillRect(...rectToCtxArgs(produceRect({
            left: rect.x,
            width: CROSSHAIR_LENGTH,
            top: rect.y,
            height: CROSSHAIR_LENGTH,
        })));
        ctx.strokeRect(
            -xOffset + (this.x - this.minX + 1 / 2) * MAP_ROOM_WIDTH - CURRENT_ROOM_BORDER,
            y + this.y * MAP_ROOM_HEIGHT - CURRENT_ROOM_BORDER,
            MAP_ROOM_WIDTH + CURRENT_ROOM_BORDER * 2,
            MAP_ROOM_HEIGHT + CURRENT_ROOM_BORDER * 2,
        );
    }

    index(x: number, y: number) {
        return `${x},${y}`;
    }

    getCurrentRoom(): Room {
        return this.map[this.currentIndex]!;
    }

    getPreviousRoom(): Room {
        return this.map[this.index(this.lastRoomIndex.x, this.lastRoomIndex.y)]!;
    }

    hasRoom(x: number, y: number) {
        const index = this.index(x, y);

        return index in this.map;
    }

    enterRoom(x: number, y: number) {
        this.lastRoomIndex = { x: this.x, y: this.y };

        this.x = x;
        this.y = y;
        this.currentIndex = this.index(x, y);

        this.redrawWorldMap();
    }

    addRoom(room: Room) {
        if (this.map[this.currentIndex]) {
            throw new Error('Adding room where we already have one!');
        }

        this.map[this.currentIndex] = room;

        /** Left room */
        this.map[this.index(this.x - 1, this.y)]?.setExternalMatchingDoorways?.({
            right: room.doors.left,
        });
        /** Right room */
        this.map[this.index(this.x + 1, this.y)]?.setExternalMatchingDoorways?.({
            left: room.doors.right,
        });
        /** Top room */
        this.map[this.index(this.x, this.y - 1)]?.setExternalMatchingDoorways?.({
            bottom: room.doors.top,
        });
        /** Bottom room */
        this.map[this.index(this.x, this.y + 1)]?.setExternalMatchingDoorways?.({
            top: room.doors.bottom,
        });

        room.setExternalMatchingDoorways({
            left: this.map[this.index(this.x - 1, this.y)]?.doors?.right,
            right: this.map[this.index(this.x + 1, this.y)]?.doors?.left,
            top: this.map[this.index(this.x, this.y - 1)]?.doors?.bottom,
            bottom: this.map[this.index(this.x, this.y + 1)]?.doors?.top,
        });

        this.redrawWorldMap();
    }
}

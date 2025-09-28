import type { Rect, Vector } from '../core/math';
import { isDefined } from '../core/types';
import { ROOM_SCALE_HEIGHT, ROOM_SCALE_WIDTH } from './room';
import type { LDTKFile, Level } from './types';

class RoomManager {
    roomLayouts: RoomType[];

    constructor() {
        this.roomLayouts = [];
    }

    setFromGameFile(file: LDTKFile) {
        this.roomLayouts = file.levels.map(level => new RoomType(level));
    }

    getValidWithDoors(doors: unknown): RoomType[] {
        return this.roomLayouts.slice();
    }
}

export class RoomType {
    name: string;
    width: number;
    height: number;
    blocks: Rect[];
    playerStart: Vector;

    constructor(level: Level) {
        this.name = level.identifier;
        this.width = Math.round(level.pxWid / ROOM_SCALE_WIDTH);
        this.height = Math.round(level.pxHei / ROOM_SCALE_HEIGHT);
        const entities = level.layerInstances.find(layer => layer.__type === 'Entities');

        if (!entities) {
            throw new Error(`Level: ${level.identifier} has no entities`);
        }

        this.blocks = entities
            .entityInstances
            .filter(e => e.__identifier === 'Solid')
            .map(solid => ({
                x: solid.px[0],
                y: solid.px[1],
                width: solid.width,
                height: solid.height,
            }));

        this.playerStart = entities
            .entityInstances
            .filter(e => e.__identifier === 'PlayerStart')
            .map(e => ({
                x: e.px[0],
                y: e.px[1],
            }))
            .find(isDefined)
            ?? { x: 0, y: 0 };
    }

    drawForMap(mapCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        mapCtx.fillStyle = 'green';

        const solids = this.blocks;

        for (const solid of solids) {
            // if (solid.blocker) {
            //     continue;
            // }

            mapCtx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }
    }
}

export const roomManager = new RoomManager();

export const gameFileFetch = fetch('./game.ldtk')
    .then(data => data.json())
    .then((file: LDTKFile) => {
        roomManager.setFromGameFile(file);
    });

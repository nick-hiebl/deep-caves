import { Actor } from '../core/actor';
import { isPointInside, rectMidpoint, type Rect, type Vector } from '../core/math';
import { Solid } from '../core/solid';
import { ECS } from '../ecs/ecs';

import { EnemyMovementSystem, EnemySystem } from './ecs/enemySystem';
import { MovingPlatform, MovingPlatformSystem } from './ecs/movingPlatformSystem';
import { ParticleSystem } from './ecs/particleSystem';
import { createPlayer, PlayerSystem } from './ecs/playerSystem';
import { DrawableRect, RectArtSystem } from './ecs/rectArtSystem';
import { ActorSystem, SolidSystem } from './ecs/solidSystem';
import { generateRoomForDoors } from './room-utils';

export const WALL_THICKNESS = 15;

export const ROOM_SCALE_WIDTH = 480;
export const ROOM_SCALE_HEIGHT = 270;

export const GAPS: Record<VerticalDoorKey | HorizontalDoorKey, [number, number]> = {
    high: [40, 80],
    medium: [ROOM_SCALE_HEIGHT / 2 - 20, ROOM_SCALE_HEIGHT / 2 + 20],
    low: [ROOM_SCALE_HEIGHT - 80, ROOM_SCALE_HEIGHT - 40],

    left: [80, 180],
    center: [ROOM_SCALE_WIDTH / 2 - 50, ROOM_SCALE_WIDTH / 2 + 50],
    right: [ROOM_SCALE_WIDTH - 180, ROOM_SCALE_WIDTH - 80],
};

export type VerticalDoorKey = 'left' | 'center' | 'right';
export type HorizontalDoorKey = 'high' | 'medium' | 'low';

const VERTICAL_DOOR_KEYS: VerticalDoorKey[] = ['left', 'center', 'right'];
const HORIZONTAL_DOOR_KEYS: HorizontalDoorKey[] = ['high', 'medium', 'low'];

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export type DoorsMap = {
    left: Partial<Record<HorizontalDoorKey, boolean | undefined>>;
    right: Partial<Record<HorizontalDoorKey, boolean | undefined>>;
    top: Partial<Record<VerticalDoorKey, boolean | undefined>>;
    bottom: Partial<Record<VerticalDoorKey, boolean | undefined>>;
}

export type SemiDoorsMap = {
    left: Partial<Record<HorizontalDoorKey, boolean | undefined>> | undefined;
    right: Partial<Record<HorizontalDoorKey, boolean | undefined>> | undefined;
    top: Partial<Record<VerticalDoorKey, boolean | undefined>> | undefined;
    bottom: Partial<Record<VerticalDoorKey, boolean | undefined>> | undefined;
};

export class Room {
    getDoorwayChance() {
        return 0.5;
    }

    static getDoorArrangement(): DoorsMap {
        return {
            top: {},
            bottom: {},
            left: {},
            right: {},
        };
    }

    static isValidAt(_x: number, _y: number) {
        return true;
    }

    /** Default room constructor works for any door arrangement */
    static areDoorsOk(setDoors: DoorsMap) {
        const arr = this.getDoorArrangement();

        return HORIZONTAL_DOOR_KEYS.every(key => {
            return (arr.left[key] === undefined || setDoors.left[key] === undefined || arr.left[key] === setDoors.left[key])
                && (arr.right[key] === undefined || setDoors.right[key] === undefined || arr.right[key] === setDoors.right[key]);
        }) && VERTICAL_DOOR_KEYS.every(key => {
            return (arr.top[key] === undefined || setDoors.top[key] === undefined || arr.top[key] === setDoors.top[key])
                && (arr.bottom[key] === undefined || setDoors.bottom[key] === undefined || arr.bottom[key] === setDoors.bottom[key]);
        });
    }

    x: number;
    y: number;
    width: number;
    height: number;

    color: string;

    blockersLocked: boolean;
    allEnemiesCleared: boolean;

    doors: DoorsMap;

    ecs: ECS;

    roomCollider: Rect;
    exits: {
        collider: Rect;
        roomPos: Vector;
        direction: 'top' | 'bottom' | 'left' | 'right';
    }[];

    constructor(x: number, y: number, width: number, height: number, color = 'blue', setDoors: Partial<DoorsMap> | undefined = {}) {
        /** Room setup */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.roomCollider = {
            x: 0,
            y: 0,
            width: width * ROOM_SCALE_WIDTH,
            height: height * ROOM_SCALE_HEIGHT,
        };

        this.exits = [];
        this.setupExits();

        this.ecs = new ECS();

        this.ecs.addSystem(new ActorSystem());
        this.ecs.addSystem(new SolidSystem());
        this.ecs.addSystem(new RectArtSystem(color));
        this.ecs.addSystem(new PlayerSystem());
        this.ecs.addSystem(new MovingPlatformSystem());
        this.ecs.addSystem(new EnemySystem());
        this.ecs.addSystem(new EnemyMovementSystem());
        this.ecs.addSystem(new ParticleSystem());

        this.color = color;

        this.blockersLocked = false;
        this.allEnemiesCleared = false;

        this.doors = {
            left: setDoors.left ?? {},
            right: setDoors.right ?? {},
            top: setDoors.top ?? {},
            bottom: setDoors.bottom ?? {},
        };

        this.globalDoorwayRectification();
        this.configureAllDoors();
        this.configureRoomContent();

        createPlayer(this.ecs, 0.5 * ROOM_SCALE_WIDTH, 0.08 * ROOM_SCALE_HEIGHT);
    }

    setupExits() {
        const BUFFER = 100;

        /** Top edge */
        for (let xOff = 0; xOff < this.width; xOff++) {
            this.exits.push({
                collider: {
                    x: xOff * ROOM_SCALE_WIDTH,
                    y: -BUFFER,
                    width: ROOM_SCALE_WIDTH,
                    height: BUFFER,
                },
                roomPos: {
                    x: this.x + xOff,
                    y: this.y - 1,
                },
                direction: 'top',
            });
        }

        /** Bottom edge */
        for (let xOff = 0; xOff < this.width; xOff++) {
            this.exits.push({
                collider: {
                    x: xOff * ROOM_SCALE_WIDTH,
                    y: this.height * ROOM_SCALE_HEIGHT,
                    width: ROOM_SCALE_WIDTH,
                    height: BUFFER,
                },
                roomPos: {
                    x: this.x + xOff,
                    y: this.y + this.height,
                },
                direction: 'bottom',
            });
        }

        /** Left edge */
        for (let yOff = 0; yOff < this.height; yOff++) {
            this.exits.push({
                collider: {
                    x: -BUFFER,
                    y: yOff * ROOM_SCALE_HEIGHT,
                    width: BUFFER,
                    height: ROOM_SCALE_HEIGHT,
                },
                roomPos: {
                    x: this.x - 1,
                    y: this.y + yOff,
                },
                direction: 'left',
            });
        }

        /** Right edge */
        for (let yOff = 0; yOff < this.height; yOff++) {
            this.exits.push({
                collider: {
                    x: this.width * ROOM_SCALE_WIDTH,
                    y: yOff * ROOM_SCALE_HEIGHT,
                    width: BUFFER,
                    height: ROOM_SCALE_HEIGHT,
                },
                roomPos: {
                    x: this.x + this.width,
                    y: this.y + yOff,
                },
                direction: 'right',
            });
        }
    }

    globalDoorwayRectification() {
        /** Basic doorway rectification rules */
        if (this.x === 0 && this.y === 0) {
            this.doors = {
                bottom: { center: true, left: false, right: false },
                top: { center: false, left: false, right: false },
                left: { high: false, medium: false, low: false },
                right: { high: false, medium: false, low: false },
            };
        } else if (this.x === 0 && this.y === 1) {
            this.doors.top = { center: true, left: false, right: false };
        } else if (this.y === 1) {
            this.doors.top = { center: false, left: false, right: false };
        }
    }

    /** Randomise un-specified doors */
    configureAllDoors() {
        /** Using constructor to access the static methods of the instantiated sub-class */
        const arr = (this.constructor as typeof Room).getDoorArrangement();
        const odds = this.getDoorwayChance();

        HORIZONTAL_DOOR_KEYS.forEach(key => {
            if (this.doors.left[key] === undefined) {
                this.doors.left[key] = arr.left[key] ?? Math.random() < odds;
            }
            if (this.doors.right[key] === undefined) {
                this.doors.right[key] = arr.right[key] ?? Math.random() < odds;
            }
        });
        VERTICAL_DOOR_KEYS.forEach(key => {
            if (this.doors.top[key] === undefined) {
                this.doors.top[key] = arr.top[key] ?? Math.random() < odds;
            }
            if (this.doors.bottom[key] === undefined) {
                this.doors.bottom[key] = arr.bottom[key] ?? Math.random() < odds;
            }
        });
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers, ladders } = generateRoomForDoors(this.doors);
        solids.concat(blockers).concat(ladders).forEach(solid => {
            const e = this.ecs.addEntity();
            this.ecs.addComponent(e, solid);
            this.ecs.addComponent(e, new DrawableRect(solid, solid.color));
        });

        const plat = this.ecs.addEntity();
        const platSolid = new Solid(220, 140, 100, 15)
        this.ecs.addComponent(plat, platSolid);
        this.ecs.addComponent(plat, new DrawableRect(platSolid, this.color));
        this.ecs.addComponent(plat, new MovingPlatform(7000, { x: 220, y: 140 }, { x: 300, y: 140 }))

        // createEnemy(this.ecs, ROOM_SCALE_WIDTH, ROOM_SCALE_HEIGHT);
        // this.enemies = [
        //     new Walker(ROOM_SCALE_WIDTH / 4 * 3, ROOM_SCALE_HEIGHT / 2),
        // ];
    }

    draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mousePosition: Vector | undefined, interpolationFactor: number) {
        /** Blank background */
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.ecs.draw(ctx);
    }

    update(mousePosition: Vector | undefined, keyboardState: Record<string, boolean>, frameDuration: number, onRoomChange: (x: number, y: number, doors: Partial<DoorsMap>) => void) {
        this.ecs.update({ mousePosition, keyboardState, frameDuration });

        this.validateLeavingRoom(onRoomChange);
    }

    validateLeavingRoom(onRoomChange: (x: number, y: number, doors: Partial<DoorsMap>) => void) {
        const players = Array.from(this.ecs.querySystem(PlayerSystem)?.values() ?? [])
            .map(entityId => this.ecs.getComponents(entityId));

        const player = players[0];

        if (!player) {
            throw new Error('No player found.');
        }

        const actor = player.get(Actor);
        const playerMidpoint = rectMidpoint(actor);

        /** Nothing to do */
        if (isPointInside(this.roomCollider, playerMidpoint.x, playerMidpoint.y)) {
            return;
        }

        const hitExit = this.exits.find(exit => isPointInside(exit.collider, playerMidpoint.x, playerMidpoint.y));

        if (!hitExit) {
            throw new Error('Player outside of room collider but has not hit any exit!');
        }

        const { direction, roomPos } = hitExit;

        const doors: Partial<DoorsMap> = direction === 'top' || direction === 'bottom'
            ? {
                [direction === 'top' ? 'bottom' : 'top']: {
                    [(['left', 'center', 'right'] as const).find(gap => playerMidpoint.x >= GAPS[gap][0] && playerMidpoint.x < GAPS[gap][1])!]: true,
                },
            } : {
                [direction === 'left' ? 'right' : 'left']: {
                    [(['low', 'medium', 'high'] as const).find(gap => playerMidpoint.y >= GAPS[gap][0] && playerMidpoint.y < GAPS[gap][1])!]: true,
                },
            };

        onRoomChange(roomPos.x, roomPos.y, doors);
    }

    setExternalMatchingDoorways(doors: Partial<SemiDoorsMap>) {
        const doorsToBlock: Partial<DoorsMap> = {};

        for (const _face in doors) {
            const face = _face as keyof DoorsMap;

            for (const _doorway in doors[face]) {
                const doorway = face === 'left' || face === 'right'
                    ? _doorway as HorizontalDoorKey
                    : _doorway as VerticalDoorKey;

                if (face === 'left' || face === 'right') {
                    const doorway = _doorway as HorizontalDoorKey;

                    if (doors[face][doorway] === false && this.doors[face][doorway] === true) {
                        doorsToBlock[face] = doorsToBlock[face] ?? {};
                        doorsToBlock[face][doorway] = true;
                    }
                } else {
                    const doorway = _doorway as VerticalDoorKey;

                    if (doors[face][doorway] === false && this.doors[face][doorway] === true) {
                        doorsToBlock[face] = doorsToBlock[face] ?? {};
                        doorsToBlock[face][doorway] = true;
                    }
                }
            }
        }

        // this.solids.push(...getDoorBlockingSolids(doorsToBlock).map(solid => {
        //     solid.color = 'yellow';
        //     return solid;
        // }));
    }

    drawForMap(mapCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        mapCtx.fillStyle = this.color;

        const solids = this.ecs.resolveEntities(this.ecs.querySystem(SolidSystem), Solid);

        for (const solid of solids) {
            if (solid.blocker) {
                continue;
            }

            mapCtx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }
    }
}

import { overlaps, type Vector } from '../core/math';
import type { Solid } from '../core/solid';
import { PlayerState } from '../player/playerState';
import { Enemy } from './enemy/enemy';
import type { EnemyInterface } from './enemy/interface';
import { Walker } from './enemy/walker';
import { MovingPlatform } from './movingPlatform';
import type { Particle } from './particle';
import { generateRoomForDoors, getDoorBlockingSolids } from './room-utils';

export const WALL_THICKNESS = 40;

export const ROOM_SCALE_WIDTH = 1280;
export const ROOM_SCALE_HEIGHT = 720;

export const GAP_SIZE = WALL_THICKNESS * 6;

export const GAPS: Record<VerticalDoorKey | HorizontalDoorKey, [number, number]> = {
    high: [120, 240],
    medium: [ROOM_SCALE_HEIGHT / 2 - 40, ROOM_SCALE_HEIGHT / 2 + 80],
    low: [ROOM_SCALE_HEIGHT - 160, ROOM_SCALE_HEIGHT - 40],

    left: [80, 280],
    center: [ROOM_SCALE_WIDTH / 2 - 100, ROOM_SCALE_WIDTH / 2 + 100],
    right: [ROOM_SCALE_WIDTH - 280, ROOM_SCALE_WIDTH - 80],
};

export type VerticalDoorKey = 'left' | 'center' | 'right';
export type HorizontalDoorKey = 'high' | 'medium' | 'low';

const VERTICAL_DOOR_KEYS: VerticalDoorKey[] = ['left', 'center', 'right'];
const HORIZONTAL_DOOR_KEYS: HorizontalDoorKey[] = ['high', 'medium', 'low'];

const OPPOSITE_FACE = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top',
};

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

    enemies: EnemyInterface[];
    solids: Solid[];
    interactives: MovingPlatform[];
    particles: Particle[];

    playerState: PlayerState;

    constructor(x: number, y: number, width: number, height: number, color = 'blue', setDoors: Partial<DoorsMap> | undefined = {}) {
        /** Room setup */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.color = color;

        this.blockersLocked = false;
        this.allEnemiesCleared = false;

        this.doors = {
            left: setDoors.left ?? {},
            right: setDoors.right ?? {},
            top: setDoors.top ?? {},
            bottom: setDoors.bottom ?? {},
        };

        this.enemies = [];
        this.solids = [];
        this.interactives = [];
        this.particles = [];

        this.globalDoorwayRectification();
        this.configureAllDoors();
        this.configureRoomContent();

        /** Player setup */
        this.playerState = new PlayerState(0.5 * ROOM_SCALE_WIDTH, 0.12 * ROOM_SCALE_HEIGHT);
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
        const arr = Room.getDoorArrangement();
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
        this.solids = solids.concat(blockers).concat(ladders);
        this.interactives = [new MovingPlatform(0, 280, 200, 40)];
        this.solids.push(...this.interactives.map(i => i.solid));

        this.enemies = [
            new Enemy(ROOM_SCALE_WIDTH, ROOM_SCALE_HEIGHT),
            new Walker(ROOM_SCALE_WIDTH / 4 * 3, ROOM_SCALE_HEIGHT / 2),
        ];
    }

    draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mousePosition: Vector | undefined, interpolationFactor: number) {
        /** Blank background */
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const solid of this.solids) {
            if (solid.color) {
                ctx.fillStyle = solid.color;
            } else {
                ctx.fillStyle = this.color;
            }
            ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }

        /** Draw particles */
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });

        /** Draw enemies */
        this.enemies.forEach(enemy => {
            enemy.draw(ctx);
        });

        /** Draw player */
        ctx.fillStyle = 'white';
        this.playerState.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    update(mousePosition: Vector | undefined, keyboardState: Record<string, boolean>, frameDuration: number, onRoomChange: (x: number, y: number, doors: Partial<DoorsMap>) => void) {
        if (!this.blockersLocked) {
            if (this.solids.some(solid => solid.blocker && overlaps(this.playerState.actor, solid))) {
                // Not yet
            } else {
                this.solids.forEach(solid => {
                    if (solid.blocker) {
                        solid.isCollidable = true;
                    }
                });
                this.blockersLocked = true;
            }
        }

        this.particles = this.particles.filter(particle => {
            particle.update(frameDuration);

            return particle.alive;
        });

        this.interactives.forEach(interactive => {
            interactive.update(frameDuration, [this.playerState.actor], this.solids);
        });

        this.enemies.forEach(enemy => {
            enemy.update(frameDuration, this, this.playerState.actor.getMidpoint());
        });

        this.playerState.update(mousePosition, keyboardState, frameDuration, this);

        this.enemies = this.enemies.filter(enemy => enemy.alive);

        if (!this.allEnemiesCleared && this.enemies.length === 0) {
            this.onAllEnemiesCleared();
            this.allEnemiesCleared = true;
        }

        this.validateLeavingRoom(onRoomChange);
    }

    validateLeavingRoom(onRoomChange: (x: number, y: number, doors: Partial<DoorsMap>) => void) {
        const playerMidpoint = this.playerState.actor.getMidpoint();
        if (playerMidpoint.x > ROOM_SCALE_WIDTH) {
            const doors: Pick<DoorsMap, 'left'> = { left: {} };
            const relevantGap = (['high', 'medium', 'low'] as const)
                .find(gap => playerMidpoint.y >= GAPS[gap][0] && playerMidpoint.y < GAPS[gap][1]);
            if (relevantGap) doors.left[relevantGap] = true;
            onRoomChange(this.x + 1, this.y, doors);
        } else if (playerMidpoint.x < 0) {
            const doors: Pick<DoorsMap, 'right'> = { right: {} };
            const relevantGap = (['high', 'medium', 'low'] as const)
                .find(gap => playerMidpoint.y >= GAPS[gap][0] && playerMidpoint.y < GAPS[gap][1]);
            if (relevantGap) doors.right[relevantGap] = true;
            onRoomChange(this.x - 1, this.y, doors);
        } else if (playerMidpoint.y > ROOM_SCALE_HEIGHT) {
            const doors: Pick<DoorsMap, 'top'> = { top: {} };
            const relevantGap = (['left', 'center', 'right'] as const)
                .find(gap => playerMidpoint.x >= GAPS[gap][0] && playerMidpoint.x < GAPS[gap][1]);
            if (relevantGap) doors.top[relevantGap] = true;
            onRoomChange(this.x, this.y + 1, doors);
        } else if (playerMidpoint.y < 0) {
            const doors: Pick<DoorsMap, 'bottom'> = { bottom: {} };
            const relevantGap = (['left', 'center', 'right'] as const)
                .find(gap => playerMidpoint.x >= GAPS[gap][0] && playerMidpoint.x < GAPS[gap][1]);
            if (relevantGap) doors.bottom[relevantGap] = true;
            onRoomChange(this.x, this.y - 1, doors);
        }
    }

    onAllEnemiesCleared() {
        this.solids = this.solids.filter(solid => !solid.blocker);
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

        this.solids.push(...getDoorBlockingSolids(doorsToBlock).map(solid => {
            solid.color = 'yellow';
            return solid;
        }));
    }

    drawForMap(mapCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        mapCtx.fillStyle = this.color;

        for (const solid of this.solids) {
            if (solid.blocker) {
                continue;
            }
            mapCtx.fillRect(solid.x, solid.y, solid.width, solid.height);
        }
    }

    addParticle(particle: Particle) {
        this.particles.push(particle);
    }
}

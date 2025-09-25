import { Solid } from '../../core/solid';
import { GhostBoss } from '../enemy/bosses/ghost-boss';
import { Room, ROOM_SCALE_HEIGHT, ROOM_SCALE_WIDTH } from '../room';
import { generateRoomForDoors } from '../room-utils';

export class GhostRoom extends Room {
    getDoorwayChance() {
        return 0;
    }

    static getDoorArrangement() {
        return {
            left: {
                high: true,
                medium: false,
                low: false
            },
            right: {
                high: true,
                medium: false,
                low: false,
            },
            bottom: {
                left: false,
                center: false,
                right: false,
            },
            top: {
                left: false,
                center: false,
                right: false,
            },
        };
    }

    static isValidAt() {
        return true;
    }

    /** Create room with outer boundary, a few ladders, enemies, and a moving platform */
    configureRoomContent() {
        /** Inner room setup */
        const { solids, blockers } = generateRoomForDoors(this.doors);
        this.solids = solids
            .concat(blockers)
            .concat(
                ...[240, 390, 540].map(y =>
                    new Solid(40, y, ROOM_SCALE_WIDTH - 80, 10, { isDroppable: true }),
                ),
            );

        this.enemies = [
            new GhostBoss(ROOM_SCALE_WIDTH / 2, ROOM_SCALE_HEIGHT / 2),
        ];
    }
}

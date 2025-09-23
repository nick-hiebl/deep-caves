import type { Actor } from '../core/actor';
import { Solid } from '../core/solid';

const LOOP_DUR = 7000;

export class MovingPlatform {
    solid: Solid;

    timeTracked: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.solid = new Solid(x, y, width, height);

        this.timeTracked = 0;
    }

    update(frameDuration: number, actors: Actor[], solids: Solid[]) {
        this.timeTracked += frameDuration;

        const timeInCycle = this.timeTracked % LOOP_DUR;

        const shouldBeInCycle = 300 + (timeInCycle > LOOP_DUR / 2 ? (LOOP_DUR - timeInCycle) / 7 : timeInCycle / 7);
        this.solid.move(shouldBeInCycle - this.solid.x, 0, actors, solids);
    }
}
const LOOP_DUR = 7000;

class MovingPlatform {
    constructor(x, y, width, height) {
        this.solid = new Solid(x, y, width, height);

        this.timeTracked = 0;
    }

    update(frameDuration, actors, solids) {
        this.timeTracked += frameDuration;

        const timeInCycle = this.timeTracked % LOOP_DUR;

        const shouldBeInCycle = 300 + (timeInCycle > LOOP_DUR / 2 ? (LOOP_DUR - timeInCycle) / 7 : timeInCycle / 7);
        this.solid.move(shouldBeInCycle - this.solid.x, 0, actors, solids);
    }
}
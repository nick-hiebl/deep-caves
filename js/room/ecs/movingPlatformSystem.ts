import { Actor } from '../../core/actor';
import { lerp, type Vector } from '../../core/math';
import { Solid } from '../../core/solid';
import type { Component, ECS, Entity, System, UpdateArgs } from '../../ecs/ecs';
import { ActorSystem, SolidSystem } from './solidSystem';

export class MovingPlatform implements Component {
    loopDuration: number;
    start: Vector;
    midpoint: Vector;

    loopState: number;

    constructor(loopDuration: number, start: Vector, midpoint: Vector) {
        this.loopDuration = loopDuration;
        this.start = start;
        this.midpoint = midpoint;

        this.loopState = 0;
    }
}

export class MovingPlatformSystem implements System {
    componentSet = new Set([Solid, MovingPlatform]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        const actors = this.ecs.resolveEntities(this.ecs.querySystem(ActorSystem), Actor);
        const solids = this.ecs.resolveEntities(this.ecs.querySystem(SolidSystem), Solid);

        entities.values().forEach(e => {
            const container = this.ecs.getComponents(e);

            const mover = container.get(MovingPlatform);
            const solid = container.get(Solid);

            mover.loopState += frameDuration;
            mover.loopState %= mover.loopDuration;

            const interpolationFactor = mover.loopState < mover.loopDuration / 2
                ? mover.loopState / mover.loopDuration * 2
                : 2 - mover.loopState / mover.loopDuration * 2;

            const targetPos = {
                x: lerp(mover.start.x, mover.midpoint.x, interpolationFactor),
                y: lerp(mover.start.y, mover.midpoint.y, interpolationFactor),
            };

            solid.move(targetPos.x - (solid.x + solid.xRemainder), targetPos.y - (solid.y + solid.yRemainder), actors, solids);
        });
    }
}

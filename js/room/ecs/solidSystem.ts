import { Actor } from '../../core/actor';
import type { Vector } from '../../core/math';
import { Solid } from '../../core/solid';
import { Component, ECS, System, type Entity, type UpdateArgs } from '../../ecs/ecs';

export class Velocity implements Component {
    velocity: Vector;

    constructor(vel: Vector) {
        this.velocity = vel;
    }
}

export class SolidSystem implements System {
    componentSet = new Set([Solid]);

    ecs!: ECS;

    update() { }
}

export class ActorSystem implements System {
    componentSet = new Set([Actor]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        const actorEntities = Array.from(entities).map(a => this.ecs.getComponents(a));
        const solids = this.ecs.resolveEntities(this.ecs.querySystem(SolidSystem), Solid);

        actorEntities.forEach(actorEntity => {
            const actor = actorEntity.get(Actor);

            if (actorEntity.has(Velocity)) {
                const v = actorEntity.get(Velocity).velocity;
                actor.moveX(v.x * frameDuration, () => { }, solids);
                actor.moveY(v.y * frameDuration, () => {
                    v.y = 0;
                }, solids);
            }

            actor.isGrounded(solids);
        });
    }
}

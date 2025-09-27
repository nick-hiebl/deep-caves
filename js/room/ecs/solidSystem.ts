import { Actor } from '../../core/actor';
import type { Vector } from '../../core/math';
import { Solid } from '../../core/solid';
import { isDefined } from '../../core/types';
import { Component, ECS, System, type Entity, type UpdateArgs } from '../../ecs/ecs';

export class Collider implements Component {
    instance: Actor | Solid;

    constructor(instance: Actor | Solid) {
        this.instance = instance;
    }

    static createActor(x: number, y: number, width: number, height: number) {
        return new Collider(new Actor(x, y, width, height));
    }

    static createSolid(x: number, y: number, width: number, height: number) {
        return new Collider(new Solid(x, y, width, height));
    }
}

export class Velocity implements Component {
    velocity: Vector;

    constructor(vel: Vector) {
        this.velocity = vel;
    }
}

export class ColliderSystem implements System {
    componentSet = new Set([Collider]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        const containers = Array.from(entities.values().map(entity => this.ecs.getComponents(entity)).filter(isDefined));
        const colliders = containers.map(e => e.get(Collider));
        const solids = Array.from(colliders.map(c => c.instance).filter(i => i instanceof Solid));
        const actors = Array.from(containers.filter(coll => coll.get(Collider).instance instanceof Actor));

        actors.forEach(actor => {
            const actorColl = actor.get(Collider);
            const a = actorColl.instance as Actor;

            if (actor.has(Velocity)) {
                const v = actor.get(Velocity).velocity;
                a.moveX(v.x * frameDuration, () => { }, solids);
                a.moveY(v.y * frameDuration, () => {
                    v.y = 0;
                }, solids);
            }

            a.isGrounded(solids);
        });
    }
}

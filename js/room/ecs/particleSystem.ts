import { square, type Vector } from '../../core/math';
import type { Component, ECS, Entity, System, UpdateArgs } from '../../ecs/ecs';

import { DrawableRect } from './rectArtSystem';
import { Velocity } from './solidSystem';

export class ParticleComponent implements Component {
    lifespan: number;
    age: number;

    constructor(lifespan: number) {
        this.lifespan = lifespan;
        this.age = 0;
    }
}

export class ParticleSystem implements System {
    componentSet = new Set([DrawableRect, ParticleComponent, Velocity]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        entities.values().forEach(entityId => {
            const entity = this.ecs.getComponents(entityId);
            const particle = entity.get(ParticleComponent);
            const drawable = entity.get(DrawableRect);
            const { velocity } = entity.get(Velocity);

            particle.age += frameDuration;

            if (particle.age >= particle.lifespan) {
                this.ecs.removeEntity(entityId);
            } else {
                drawable.rect.x += velocity.x * frameDuration;
                drawable.rect.y += velocity.y * frameDuration;
                drawable.opacity = 1 - square(particle.age / particle.lifespan);
            }
        });
    }
}

export function createParticle(ecs: ECS, pos: Vector, radius: number, vel: Vector, color: string, lifespan: number): Entity {
    const e = ecs.addEntity();
    ecs.addComponent(e, new DrawableRect({
        x: pos.x - radius,
        y: pos.y - radius,
        width: radius * 2,
        height: radius * 2,
    }, color));
    ecs.addComponent(e, new Velocity(vel));
    ecs.addComponent(e, new ParticleComponent(lifespan));

    return e;
}

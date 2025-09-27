import { Actor } from '../../core/actor';
import { overlaps, type Vector } from '../../core/math';
import { Solid } from '../../core/solid';
import { Component, ECS, System, type Entity, type UpdateArgs } from '../../ecs/ecs';

import { EnemySystem } from './enemySystem';
import { PlayerSystem } from './playerSystem';

export class Velocity implements Component {
    velocity: Vector;

    constructor(vel: Vector) {
        this.velocity = vel;
    }
}

export class SolidSystem implements System {
    componentSet = new Set([Solid]);

    ecs!: ECS;

    state: 'pre-lock' | 'locked' | 'cleared' = 'pre-lock'

    update(entities: Set<Entity>) {
        if (this.state === 'pre-lock') {
            const players = this.ecs.resolveEntities(this.ecs.querySystem(PlayerSystem), Actor);
            const blockers = this.ecs.resolveEntities(entities, Solid)
                .filter(solid => solid.blocker);

            /** Check if player is still overlapping any blocker. */
            if (blockers.some(blocker => players.some(player => overlaps(blocker, player)))) {
                return;
            }

            blockers.forEach(blocker => { blocker.isCollidable = true });
            this.state = 'locked';
        } else if (this.state === 'locked') {
            /** No enemy system to query right now. */
            const enemies = this.ecs.querySystem(EnemySystem);

            if (enemies && enemies.size > 0) {
                return;
            }

            entities
                .values()
                .filter(entity => this.ecs.getComponents(entity).get(Solid).blocker)
                .forEach(blocker => {
                    this.ecs.removeEntity(blocker);
                });
        }
    }
}

export class ActorSystem implements System {
    componentSet = new Set([Actor]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        const actorEntities = Array.from(entities).map(a => this.ecs.getComponents(a));
        const solids = this.ecs.resolveEntities(this.ecs.querySystem(SolidSystem), Solid);

        actorEntities.forEach(actorEntity => {
            const actor = actorEntity.get(Actor);
            const colliders = actor.isNonPhysical ? [] : solids;

            if (actorEntity.has(Velocity)) {
                const v = actorEntity.get(Velocity).velocity;
                actor.moveX(v.x * frameDuration, () => { }, colliders);
                actor.moveY(v.y * frameDuration, () => {
                    v.y = 0;
                }, colliders);
            }

            actor.isGrounded(solids);
        });
    }
}

import { Actor } from '../../core/actor';
import { incDecLatch, type IncDecLatch } from '../../core/latch';
import { approach, distance, rectMidpoint, type Vector } from '../../core/math';
import { Sprite } from '../../core/sprite';
import type { Component, ECS, Entity, System, UpdateArgs } from '../../ecs/ecs';

import { PlayerSystem } from './playerSystem';
import { Velocity } from './solidSystem';

const X_SPEED = 300 / 1000;
const X_ACCEL = 1 / 1000;
const Y_ACCEL = 2 / 1000;

const GHOSTY_SPRITE = Sprite('./img/ghosty.png');

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 32;
const ENEMY_WIDTH = 48;
const ENEMY_HEIGHT = 64;

export class EnemyComponent implements Component { }

export class EnemyMovement implements Component {
    hp: number;

    facing: 'left' | 'right';

    isNonPhysical: boolean;

    hurtViz: IncDecLatch;

    constructor() {
        this.hp = 3;
        this.facing = 'left';
        this.isNonPhysical = true;
        this.hurtViz = incDecLatch(1, 250);
    }
}

export class EnemySystem implements System {
    componentSet = new Set([EnemyComponent]);

    ecs!: ECS;

    update() { }
}

export class EnemyMovementSystem implements System {
    componentSet = new Set([EnemyMovement, Actor, Velocity]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration }: UpdateArgs) {
        const players = this.ecs.resolveEntities(this.ecs.querySystem(PlayerSystem), Actor)
            .map(p => rectMidpoint(p));

        const enemies = Array.from(entities.values().map(e => this.ecs.getComponents(e)));

        enemies.forEach(enemy => {
            const enemyC = enemy.get(EnemyMovement);
            const myMid = rectMidpoint(enemy.get(Actor));
            const v = enemy.get(Velocity).velocity;

            const [target] = players.reduce<[Vector | undefined, number]>(([point, bestDist], target) => {
                const thisDist = distance(myMid, target);

                if (thisDist < bestDist) {
                    return [target, thisDist];
                }

                return [point, bestDist];
            }, [undefined, Infinity]);

            if (target) {
                if (target.x < myMid.x) {
                    v.x = approach(-X_SPEED, v.x, X_ACCEL * frameDuration);
                    enemyC.facing = 'left';
                } else {
                    v.x = approach(X_SPEED, v.x, X_ACCEL * frameDuration);
                    enemyC.facing = 'right';
                }

                v.y = approach(target.y < myMid.y ? -X_SPEED : X_SPEED, v.y, Y_ACCEL * frameDuration);
            }
        });
    }

    draw(entities: Set<Entity>, ctx: CanvasRenderingContext2D) {
        entities.values().forEach(e => {
            const enemy = this.ecs.getComponents(e);
            const enemyC = enemy.get(EnemyMovement);
            const actor = enemy.get(Actor);

            ctx.drawImage(
                GHOSTY_SPRITE,
                enemyC.facing === 'left' ? 0 : SPRITE_WIDTH,
                0,
                SPRITE_WIDTH,
                SPRITE_HEIGHT,
                actor.x,
                actor.y,
                actor.width,
                actor.height,
            );
        });
    }
}

export const createEnemy = (ecs: ECS, x: number, y: number): Entity => {
    const enemy = ecs.addEntity();
    ecs.addComponent(enemy, new EnemyMovement());

    const actor = new Actor(x, y, ENEMY_WIDTH, ENEMY_HEIGHT);
    actor.isNonPhysical = true;

    ecs.addComponent(enemy, actor);
    ecs.addComponent(enemy, new EnemyComponent());
    ecs.addComponent(enemy, new Velocity({ x: 0, y: 0 }));

    return enemy;
};

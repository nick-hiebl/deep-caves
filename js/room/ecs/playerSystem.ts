import { Actor } from '../../core/actor';
import { approach } from '../../core/math';
import { Sprite } from '../../core/sprite';
import { isDefined } from '../../core/types';
import type { Component, ECS, Entity, System, UpdateArgs } from '../../ecs/ecs';
import type { BufferedThrottledInputController } from '../../player/inputController';
import { JumpController } from '../../player/jumpController';

import { Velocity } from './solidSystem';

const LEFT_KEY = 'a';
const DOWN_KEY = 's';
const RIGHT_KEY = 'd';
const ATTACK_KEY = 'j';

/** Player physics details */
const SPRITE_WIDTH = 28;
const SPRITE_HEIGHT = 36;

const PLAYER_WIDTH = 56;
const PLAYER_HEIGHT = 72;

/** Player speed per millisecond */
const SPEED = 450 / 1000;
const PLAYER_X_ACCEL = 2.5 / 1000;
const JUMP_MAGNITUDE = 1;

const PLAYER_SPRITE = Sprite('./img/sword_man.png');

const getImageCoordinates = (attacking: boolean, facing: 'left' | 'right', hasShield: boolean) => {
    let x = 0, y = 0;
    if (facing === 'right') {
        x += SPRITE_WIDTH;
    }
    if (attacking) {
        y += SPRITE_HEIGHT;
    }
    if (hasShield) {
        x += SPRITE_WIDTH * 2;
    }

    return { x, y };
};

export class PlayerComponent implements Component {
    facing: 'left' | 'right';

    jumpController: JumpController;
    // attackController: BufferedThrottledInputController;

    constructor() {
        this.facing = 'left';
        this.jumpController = new JumpController();
    }
}

export class PlayerSystem implements System {
    componentSet = new Set([PlayerComponent, Actor, Velocity]);

    ecs!: ECS;

    update(entities: Set<Entity>, { frameDuration, keyboardState }: UpdateArgs) {
        entities.values().map(e => this.ecs.getComponents(e)).filter(isDefined).forEach(e => {
            const actor = e.get(Actor);
            const velocity = e.get(Velocity).velocity;
            const playerComponent = e.get(PlayerComponent);

            const xInput = (keyboardState[RIGHT_KEY] ? 1 : 0) - (keyboardState[LEFT_KEY] ? 1 : 0);
            velocity.x = approach(xInput * SPEED, velocity.x, PLAYER_X_ACCEL * frameDuration);

            const { yAcceleration, isJumping } = playerComponent.jumpController.update(keyboardState, frameDuration, velocity.y);

            velocity.y += yAcceleration * frameDuration;

            if (isJumping) {
                // Add particles
                velocity.y = -JUMP_MAGNITUDE;
            }

            if (xInput > 0) {
                playerComponent.facing = 'right';
            } else if (xInput < 0) {
                playerComponent.facing = 'left';
            }

            actor.setDropping(keyboardState[DOWN_KEY]);

            playerComponent.jumpController.groundedCheck(actor.grounded, isJumping);
        });
    }

    draw(entities: Set<Entity>, ctx: CanvasRenderingContext2D) {
        entities.values().map(e => this.ecs.getComponents(e)).filter(isDefined).forEach(e => {
            const actor = e.get(Actor);
            const playerComponent = e.get(PlayerComponent);

            const isAttacking = false;
            // Draw attack also

            const { x: sx, y: sy } = getImageCoordinates(isAttacking, playerComponent.facing, true);
            ctx.drawImage(PLAYER_SPRITE, sx, sy, SPRITE_WIDTH, SPRITE_HEIGHT, actor.x, actor.y, actor.width, actor.height);
        });
    }
}

export const createPlayer = (ecs: ECS, x: number, y: number): Entity => {
    const player = ecs.addEntity();
    ecs.addComponent(player, new PlayerComponent());
    ecs.addComponent(player, new Actor(x, y, PLAYER_WIDTH, PLAYER_HEIGHT));
    ecs.addComponent(player, new Velocity({ x: 0, y: 0 }));

    return player;
};

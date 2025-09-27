import type { Rect } from '../../core/math';
import { isDefined } from '../../core/types';
import { Component, ECS, System, type Entity } from '../../ecs/ecs';

export class DrawableRect implements Component {
    color: string | undefined;
    rect: Rect;

    constructor(rect: Rect, color?: string) {
        this.color = color;
        this.rect = rect;
    }
}

export class RectArtSystem implements System {
    componentSet = new Set([DrawableRect]);

    ecs!: ECS;

    color: string;

    constructor(color: string) {
        this.color = color;
    }

    update() { }

    draw(entities: Set<Entity>, ctx: CanvasRenderingContext2D) {
        const rects = entities.values().map(e => this.ecs.getComponents(e)).filter(isDefined).map(e => e.get(DrawableRect));
        
        rects.forEach(({ rect, color }) => {
            if (color) {
                ctx.fillStyle = color;
            } else {
                ctx.fillStyle = this.color;
            }

            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        });
    }
}

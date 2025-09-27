import type { Vector } from '../core/math';

export type KeyboardState = Record<string, boolean>;

export type UpdateArgs = {
    mousePosition: Vector | undefined;
    keyboardState: KeyboardState;
    frameDuration: number;
};

export type Entity = number;

export abstract class Component { }

export abstract class System {
    abstract componentSet: Set<Function>;

    abstract update(entities: Set<Entity>, args: UpdateArgs): void;

    abstract draw?(entities: Set<Entity>, ctx: CanvasRenderingContext2D): void;

    ecs!: ECS;
}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class ComponentContainer {
    private map = new Map<Function, Component>();

    add(component: Component): void {
        this.map.set(component.constructor, component);
    }

    get<T extends Component>(componentClass: ComponentClass<T>): T {
        return this.map.get(componentClass) as T;
    }

    has(componentClass: Function): boolean {
        return this.map.has(componentClass);
    }

    delete(componentClass: Function) {
        this.map.delete(componentClass);
    }
}

export class ECS {
    private entities = new Map<Entity, ComponentContainer>();
    private systems = new Map<System, Set<Entity>>();

    private nextEntityId = 0;
    private entitiesToDelete = new Array<Entity>();

    addEntity(): Entity {
        const entity = this.nextEntityId;
        this.nextEntityId++;
        this.entities.set(entity, new ComponentContainer());
        return entity;
    }

    removeEntity(entity: Entity) {
        this.entitiesToDelete.push(entity);
    }

    addComponent(entity: Entity, component: Component) {
        const container = this.entities.get(entity);

        if (container) {
            container.add(component);
            this.checkEntitySystemMemberships(entity);
        }
    }

    getComponents(entity: Entity): ComponentContainer {
        const e = this.entities.get(entity);

        if (!e) {
            throw new Error('Could not find requested entity');
        }

        return e;
    }

    removeComponent(entity: Entity, componentClass: Function) {
        const container = this.entities.get(entity);

        if (container) {
            container.delete(componentClass);
            this.checkEntitySystemMemberships(entity);
        }
    }

    addSystem(system: System) {
        system.ecs = this;

        this.systems.set(system, new Set());
        for (const entity of this.entities.keys()) {
            this.checkEntitySystemMembership(entity, system);
        }
    }

    querySystem(systemClass: Function): Set<Entity> | undefined {
        return Array.from(this.systems.entries()).find(([system, entities]) => {
            return system instanceof systemClass;
        })?.[1];
    }

    resolveEntities<T extends Component>(entities: Set<Entity> | undefined, componentClass: ComponentClass<T>): T[] {
        if (!entities) {
            return [];
        }

        return Array.from(entities.values()).map(e => this.getComponents(e)).map(c => c.get(componentClass));
    }

    removeSystem(system: System) {
        this.systems.delete(system);
    }

    update(args: UpdateArgs) {
        this.systems.entries().forEach(([system, entities]) => {
            system.update(entities, args);
        });

        this.entitiesToDelete.forEach(entity => {
            this.deleteEntity(entity);
        });

        this.entitiesToDelete = [];
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.systems.entries().forEach(([system, entities]) => {
            system.draw?.(entities, ctx);
        });
    }

    private deleteEntity(entity: Entity) {
        this.entities.delete(entity);
        this.systems.values().forEach(systemSet => {
            systemSet.delete(entity);
        });
    }

    private checkEntitySystemMemberships(entity: Entity) {
        for (const system of this.systems.keys()) {
            this.checkEntitySystemMembership(entity, system);
        }
    }

    private checkEntitySystemMembership(entity: Entity, system: System) {
        const componentContainer = this.entities.get(entity);
        const systemSet = this.systems.get(system);

        if (!componentContainer || !systemSet) {
            return;
        }

        if (Array.from(system.componentSet).every(componentClass => componentContainer.has(componentClass))) {
            systemSet.add(entity);
        } else {
            systemSet.delete(entity);
        }
    }
}

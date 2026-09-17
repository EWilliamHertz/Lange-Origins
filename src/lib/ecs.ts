export type EntityId = number;

export abstract class Component {
    // Empty base class for components
}

// Type alias for constructor of a component
export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class Entity {
    public id: EntityId;
    private components: Map<Function, Component> = new Map();

    constructor(id: EntityId) {
        this.id = id;
    }

    addComponent<T extends Component>(component: T): void {
        this.components.set(component.constructor, component);
    }

    getComponent<T extends Component>(componentClass: ComponentClass<T>): T | undefined {
        return this.components.get(componentClass) as T;
    }

    removeComponent<T extends Component>(componentClass: ComponentClass<T>): void {
        this.components.delete(componentClass);
    }

    hasComponent<T extends Component>(componentClass: ComponentClass<T>): boolean {
        return this.components.has(componentClass);
    }
}

export abstract class System {
    public world!: ECSWorld;
    abstract update(dt: number): void;
}

export class ECSWorld {
    private entities: Map<EntityId, Entity> = new Map();
    private systems: System[] = [];
    private nextEntityId: EntityId = 1;

    createEntity(): Entity {
        const entity = new Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        return entity;
    }

    destroyEntity(id: EntityId): void {
        this.entities.delete(id);
    }

    getEntity(id: EntityId): Entity | undefined {
        return this.entities.get(id);
    }

    getEntitiesWith<T extends Component>(componentClass: ComponentClass<T>): Entity[] {
        return Array.from(this.entities.values()).filter(e => e.hasComponent(componentClass));
    }

    addSystem(system: System): void {
        system.world = this;
        this.systems.push(system);
    }

    update(dt: number): void {
        for (const system of this.systems) {
            system.update(dt);
        }
    }
}

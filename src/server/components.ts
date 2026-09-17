import { Component } from '../lib/ecs';

export class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) { super(); }
}

export class Velocity extends Component {
    constructor(public vx: number = 0, public vy: number = 0) { super(); }
}

export class Health extends Component {
    constructor(public hp: number, public maxHp: number) { super(); }
}

export class Collider extends Component {
    constructor(public width: number, public height: number, public solid: boolean = true) { super(); }
}

// Discriminator for AI vs Player
export class PlayerController extends Component {
    constructor(public socketId: string, public name: string, public uid?: string, public profileId?: string) { super(); }
}

export class AIController extends Component {
    constructor(public type: string, public ownerId?: string, public facingRight: boolean = true) { super(); }
}

export class ItemDrop extends Component {
    constructor(public itemType: number, public count: number = 1) { super(); }
}

export class Projectile extends Component {
    constructor(public type: string, public ownerId: string, public damage: number, public life: number) { super(); }
}

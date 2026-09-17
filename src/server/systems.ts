import { System, Entity } from '../lib/ecs';
import { Position, Velocity, Projectile } from './components';
import { GameRoom } from './GameRoom';

export class ProjectileSystem extends System {
    constructor(private room: GameRoom) {
        super();
    }

    update(dt: number): void {
        const entities = this.world.getEntitiesWith(Projectile);
        
        for (const ent of entities) {
            const pos = ent.getComponent(Position);
            const vel = ent.getComponent(Velocity);
            const proj = ent.getComponent(Projectile);

            if (!pos || !vel || !proj) continue;

            pos.x += vel.vx;
            pos.y += vel.vy;

            if (proj.type === 'grenade') vel.vy += 0.5; // gravity for grenade
            else if (proj.type !== 'fireball') vel.vy += 0.1; // slight gravity

            proj.life--;

            const tx = Math.floor((pos.x + (proj.type === 'grenade' ? 8 : 4)) / 32);
            const ty = Math.floor((pos.y + (proj.type === 'grenade' ? 8 : 4)) / 32);

            let destroyed = false;
            let hitMob = false;

            // Collision with blocks
            if (this.room.world[tx] && this.room.world[tx][ty] && this.room.world[tx][ty] !== 0 && this.room.world[tx][ty] !== 31 && this.room.world[tx][ty] !== 32) {
                if (proj.type === 'grenade' || proj.type === 'rocket') {
                    this.room.triggerExplosion(tx, ty, 3, 20);
                }
                destroyed = true;
            }

            // Collision with mobs (legacy integration)
            if (!destroyed) {
                for (const mId in this.room.mobs) {
                    const m = this.room.mobs[mId];
                    if (pos.x >= m.x - 10 && pos.x <= m.x + 32 && pos.y >= m.y - 10 && pos.y <= m.y + 32) {
                        if (proj.type === 'grenade') {
                            this.room.triggerExplosion(tx, ty, 3, 20);
                        } else {
                            m.hp -= proj.damage || 5;
                            m.vy = -5;
                            m.vx = vel.vx > 0 ? 5 : -5;
                        }
                        hitMob = true;
                        break;
                    }
                }
            }

            if (hitMob || proj.life <= 0 || destroyed) {
                if (proj.life <= 0 && proj.type === 'grenade' && !destroyed) {
                    this.room.triggerExplosion(tx, ty, 3, 20);
                }
                this.world.destroyEntity(ent.id);
            }
        }
    }
}

import { ItemDrop } from './components';

export class ItemPhysicsSystem extends System {
    constructor(private room: GameRoom) {
        super();
    }

    update(dt: number): void {
        const entities = this.world.getEntitiesWith(ItemDrop);
        for (const ent of entities) {
            const pos = ent.getComponent(Position);
            const vel = ent.getComponent(Velocity);
            if (!pos || !vel) continue;

            vel.vy += 1; // gravity
            pos.y += vel.vy;
            pos.x += vel.vx;
            vel.vx *= 0.9; // friction
            
            const tx = Math.floor((pos.x + 8) / 32);
            const ty = Math.floor((pos.y + 16) / 32);
            
            if (this.room.world[tx] && this.room.world[tx][ty] && this.room.world[tx][ty] !== 0) {
                // Bounce slightly if falling fast
                if (vel.vy > 2) {
                   vel.vy = -vel.vy * 0.4;
                   pos.y = ty * 32 - 16 - 0.01;
                } else {
                   vel.vy = 0;
                   vel.vx = 0;
                   pos.y = ty * 32 - 16 - 0.01;
                }
            }
        }
    }
}

import { ECSWorld } from '../lib/ecs';
import { World, generateWorld } from '../lib/world';
import { Server as SocketIOServer } from 'socket.io';

import { ProjectileSystem, ItemPhysicsSystem } from './systems';
import { Position, Velocity, Projectile, ItemDrop } from './components';

export class GameRoom {
    public id: string;
    public world: World;
    public players: Record<string, any> = {};
    public mobs: Record<string, any> = {};
    public items: Record<string, any> = {};
    public chests: Record<string, any[]> = {};
    public parties: Record<string, any> = {};
    public trades: Record<string, any> = {};
    public projectiles: Record<string, any> = {};
    
    public createdAt: number;
    public timeOfDay: number = 0;
    
    public ecsWorld: ECSWorld;
    
    // We keep io reference here so GameRoom can broadcast
    public io: SocketIOServer;
    public db: any;

    constructor(id: string, io: SocketIOServer, db: any) {
        this.id = id;
        this.world = generateWorld(id);
        this.createdAt = Date.now();
        this.ecsWorld = new ECSWorld();
        this.io = io;
        this.db = db;
        
        // Add Systems
        this.ecsWorld.addSystem(new ProjectileSystem(this));
        this.ecsWorld.addSystem(new ItemPhysicsSystem(this));
    }

    public triggerExplosion(cx: number, cy: number, radius: number, damage: number) {
        let worldUpdated = false;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    if (this.world[tx] && this.world[tx][ty] !== undefined && this.world[tx][ty] !== 0 && this.world[tx][ty] !== 21) {
                        const blockType = this.world[tx][ty];
                        this.world[tx][ty] = 0; // Air
                        worldUpdated = true;
                        this.io.to(this.id).emit('world_updated', { tx, ty, blockType: 0 });
                        
                        // Spawn dropped item
                        const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
                        this.items[id] = {
                            id, type: blockType,
                            x: tx * 32 + 16 + (Math.random() - 0.5) * 16,
                            y: ty * 32 + 16 + (Math.random() - 0.5) * 16,
                            vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 4
                        };

                        if (blockType === 34) {
                            setTimeout(() => this.triggerExplosion(tx, ty, 4, 30), 200);
                        }
                    }
                }
            }
        }
        
        const expPx = cx * 32 + 16;
        const expPy = cy * 32 + 16;
        const pxRadius = radius * 32;
        
        for (const mId in this.mobs) {
            const m = this.mobs[mId];
            const dist = Math.sqrt(Math.pow(m.x + 16 - expPx, 2) + Math.pow(m.y + 16 - expPy, 2));
            if (dist <= pxRadius) {
                m.hp -= damage;
                m.vy = -10;
                m.vx = m.x > expPx ? 10 : -10;
            }
        }
        
        for (const pId in this.players) {
            const p = this.players[pId];
            const dist = Math.sqrt(Math.pow(p.x + 16 - expPx, 2) + Math.pow(p.y + 16 - expPy, 2));
            if (dist <= pxRadius) {
                this.io.to(pId).emit('damage_indicator', { id: Math.random().toString(), x: p.x, y: p.y, damage });
                this.io.to(pId).emit('take_damage', { damage, vx: p.x > expPx ? 15 : -15, vy: -10 });
            }
        }
    }

    public tick(dt: number) {
        this.ecsWorld.update(dt);
        
        // Sync ECS Projectiles to legacy object for broadcasting
        this.projectiles = {};
        for (const ent of this.ecsWorld.getEntitiesWith(Projectile)) {
            const pos = ent.getComponent(Position);
            const vel = ent.getComponent(Velocity);
            const proj = ent.getComponent(Projectile);
            if (pos && vel && proj) {
                this.projectiles[ent.id] = {
                    id: ent.id, x: pos.x, y: pos.y, vx: vel.vx, vy: vel.vy,
                    type: proj.type, life: proj.life, damage: proj.damage, ownerId: proj.ownerId
                };
            }
        }
    }
}

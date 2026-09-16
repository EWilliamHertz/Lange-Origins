import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const explosionLogic = `
function triggerExplosion(room: any, roomId: string, cx: number, cy: number, radius: number, damage: number) {
    let worldUpdated = false;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const tx = cx + dx;
                const ty = cy + dy;
                if (room.world[tx] && room.world[tx][ty] !== undefined && room.world[tx][ty] !== 0 && room.world[tx][ty] !== 21) {
                    // 21 is AdminBrick
                    const blockType = room.world[tx][ty];
                    room.world[tx][ty] = 0; // Air
                    worldUpdated = true;
                    // Send to client
                    io.to(roomId).emit('world_updated', { tx, ty, blockType: 0 });
                    
                    // Chain reaction for TNT
                    if (blockType === 34) {
                        setTimeout(() => triggerExplosion(room, roomId, tx, ty, 4, 30), 200);
                    }
                }
            }
        }
    }
    
    // Damage mobs
    const expPx = cx * 32 + 16;
    const expPy = cy * 32 + 16;
    const pxRadius = radius * 32;
    for (const mId in room.mobs) {
        const m = room.mobs[mId];
        const dist = Math.sqrt(Math.pow(m.x + 16 - expPx, 2) + Math.pow(m.y + 16 - expPy, 2));
        if (dist <= pxRadius) {
            m.hp -= damage;
            m.vy = -10;
            m.vx = m.x > expPx ? 10 : -10;
        }
    }
    
    // Damage players
    for (const pId in room.players) {
        const p = room.players[pId];
        const dist = Math.sqrt(Math.pow(p.x + 16 - expPx, 2) + Math.pow(p.y + 16 - expPy, 2));
        if (dist <= pxRadius) {
            // we could emit damage event to player
            io.to(pId).emit('damage_indicator', { id: Math.random().toString(), x: p.x, y: p.y, damage });
            io.to(pId).emit('take_damage', { damage, vx: p.x > expPx ? 15 : -15, vy: -10 });
        }
    }
}
`;

code = code.replace(/const activeRooms: Record<string, \{/, explosionLogic + "\n  const activeRooms: Record<string, {");
fs.writeFileSync('server.ts', code);

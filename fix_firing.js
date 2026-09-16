import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const fireLogic = `
    socket.on('fire_projectile', (data: { type: string, x: number, y: number, vx: number, vy: number }) => {
        if (currentRoom && activeRooms[currentRoom]) {
            const room = activeRooms[currentRoom];
            const pId = 'proj_' + Math.random().toString(36).substr(2, 9);
            room.projectiles[pId] = {
                id: pId,
                ownerId: socket.id,
                type: data.type,
                x: data.x,
                y: data.y,
                vx: data.vx,
                vy: data.vy,
                life: data.type === 'grenade' ? 60 : 40,
                damage: data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : 0)
            };
        }
    });
`;

code = code.replace(/socket\.on\('hit_mob',/, fireLogic + "\n    socket.on('hit_mob',");

fs.writeFileSync('server.ts', code);

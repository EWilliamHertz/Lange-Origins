import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const updatedTick = `
      // Projectiles
      for (const pId in room.projectiles) {
         const p = room.projectiles[pId];
         p.x += p.vx;
         p.y += p.vy;
         
         if (p.type === 'grenade') p.vy += 0.5; // gravity for grenade
         else p.vy += 0.1; // slight gravity for arrows/bullets
         
         p.life--;
         
         const tx = Math.floor((p.x + (p.type === 'grenade' ? 8 : 4)) / 32);
         const ty = Math.floor((p.y + (p.type === 'grenade' ? 8 : 4)) / 32);
         
         // Collision with blocks
         if (room.world[tx] && room.world[tx][ty] && room.world[tx][ty] !== 0 && room.world[tx][ty] !== 31 && room.world[tx][ty] !== 32) {
             if (p.type === 'grenade' || p.type === 'rocket') {
                 triggerExplosion(room, roomId, tx, ty, 3, 20);
             }
             delete room.projectiles[pId];
             continue;
         }
         
         // Collision with mobs
         let hitMob = false;
         for (const mId in room.mobs) {
             const m = room.mobs[mId];
             if (p.x >= m.x - 10 && p.x <= m.x + 32 && p.y >= m.y - 10 && p.y <= m.y + 32) {
                 if (p.type === 'grenade') {
                     triggerExplosion(room, roomId, tx, ty, 3, 20);
                 } else {
                     m.hp -= p.damage || 5;
                     m.vy = -5;
                     m.vx = p.vx > 0 ? 5 : -5;
                 }
                 hitMob = true;
                 break;
             }
         }
         
         if (hitMob || p.life <= 0) {
             if (p.life <= 0 && p.type === 'grenade') {
                 triggerExplosion(room, roomId, tx, ty, 3, 20);
             }
             delete room.projectiles[pId];
         }
      }

      // Redstone & Logic
      const powered = new Set<string>();
      const toCheck: {x: number, y: number}[] = [];
      
      // Find pressure plates being stepped on
      for (const pId in room.players) {
          const p = room.players[pId];
          const px = Math.floor((p.x + 12) / 32);
          const py = Math.floor((p.y + 12) / 32);
          const py2 = Math.floor((p.y + 32) / 32);
          
          if (room.world[px]) {
              if (room.world[px][py] === 32) {
                  const key = px + ',' + py;
                  if (!powered.has(key)) { powered.add(key); toCheck.push({x: px, y: py}); }
              }
              if (room.world[px][py2] === 32) {
                  const key = px + ',' + py2;
                  if (!powered.has(key)) { powered.add(key); toCheck.push({x: px, y: py2}); }
              }
          }
      }
      
      // BFS for wire
      let iters = 0;
      while (toCheck.length > 0 && iters < 1000) {
          iters++;
          const curr = toCheck.shift()!;
          const neighbors = [
              {x: curr.x+1, y: curr.y}, {x: curr.x-1, y: curr.y},
              {x: curr.x, y: curr.y+1}, {x: curr.x, y: curr.y-1}
          ];
          for (const n of neighbors) {
              const key = n.x + ',' + n.y;
              if (!powered.has(key) && room.world[n.x]) {
                  const block = room.world[n.x][n.y];
                  if (block === 31 || block === 29 || block === 33 || block === 34) { // Wire, Door, DoorOpen, TNT
                      powered.add(key);
                      if (block === 31) toCheck.push({x: n.x, y: n.y}); // only propagate through wire
                      
                      if (block === 29) {
                          room.world[n.x][n.y] = 33;
                          io.to(roomId).emit('world_updated', { tx: n.x, ty: n.y, blockType: 33 });
                      } else if (block === 34) {
                          // Ignite TNT
                          triggerExplosion(room, roomId, n.x, n.y, 4, 30);
                      }
                  }
              }
          }
      }
      
      // Broadcast projectiles
      io.to(roomId).emit('projectiles_update', room.projectiles);
`;

code = code.replace(/\/\/ Check Redstone\/Pressure Plates for players[\s\S]*?\} else \{[\s\S]*?\}/, updatedTick.trim());

fs.writeFileSync('server.ts', code);

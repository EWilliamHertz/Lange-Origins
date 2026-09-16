const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `                    const blockType = room.world[tx][ty];
                    room.world[tx][ty] = 0; // Air
                    worldUpdated = true;
                    // Send to client
                    io.to(roomId).emit('world_updated', { tx, ty, blockType: 0 });
                    
                    // Spawn dropped item
                    const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
                    room.items[id] = {
                        id,
                        type: blockType,
                        x: tx * 32 + 16 + (Math.random() - 0.5) * 16,
                        y: ty * 32 + 16 + (Math.random() - 0.5) * 16,
                        vx: (Math.random() - 0.5) * 8,
                        vy: -4 - Math.random() * 4
                    };

                    // Chain reaction for TNT`;

code = code.replace(
  `                    const blockType = room.world[tx][ty];
                    room.world[tx][ty] = 0; // Air
                    worldUpdated = true;
                    // Send to client
                    io.to(roomId).emit('world_updated', { tx, ty, blockType: 0 });
                    
                    // Chain reaction for TNT`,
  replacement
);

fs.writeFileSync('server.ts', code);
console.log('Fixed block explosion drops');

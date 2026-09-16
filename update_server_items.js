import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const bouncePhysics = `
        if (room.world[tx] && room.world[tx][ty] && room.world[tx][ty] !== 0) {
          // Bounce slightly if falling fast
          if (item.vy > 2) {
             item.vy = -item.vy * 0.4;
             item.y = ty * 32 - 16 - 0.01;
          } else {
             item.vy = 0;
             item.vx = 0;
             item.y = ty * 32 - 16 - 0.01;
          }
        }
`;
code = code.replace(/if \(room\.world\[tx\] && room\.world\[tx\]\[ty\] && room\.world\[tx\]\[ty\] !== 0\) \{\n\s*item\.vy = 0;\n\s*item\.vx = 0;\n\s*item\.y = ty \* 32 - 16 - 0\.01;\n\s*\}/, bouncePhysics);

// Add 'drop_item' event
const dropEvent = `
    socket.on('drop_item', (data: { type: number, count: number, facingRight: boolean }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const player = activeRooms[currentRoom].players[socket.id];
      if (!player) return;
      
      const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random()*1000);
      const tossVx = data.facingRight ? 10 : -10;
      activeRooms[currentRoom].items[itemId] = {
        id: itemId,
        type: data.type,
        count: data.count,
        x: player.x + (data.facingRight ? 32 : -16),
        y: player.y - 16, // Throw from chest height
        vx: tossVx,
        vy: -8 // toss up a bit
      };
      io.to(currentRoom).emit('world_state', activeRooms[currentRoom]);
    });

    socket.on('player_update',
`;
code = code.replace(/socket\.on\('player_update',/, dropEvent);
fs.writeFileSync('server.ts', code);

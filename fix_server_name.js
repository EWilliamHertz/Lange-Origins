import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/activeRooms\[roomId\]\.players\[socket\.id\] = \{ id: socket\.id, x: startX, y: startY, facingRight: true, vx: 0, vy: 0 \};/, "activeRooms[roomId].players[socket.id] = { id: socket.id, name: nickname, x: startX, y: startY, facingRight: true, vx: 0, vy: 0 };");

code = code.replace(/socket\.on\('player_update', \(data: \{ x: number, y: number, facingRight: boolean, vx: number, vy: number \}\) => \{/, "socket.on('player_update', (data: { x: number, y: number, facingRight: boolean, vx: number, vy: number, name?: string }) => {");

code = code.replace(/activeRooms\[currentRoom\]\.players\[socket\.id\] = \{\n\s*id: socket\.id,\n\s*x: data\.x,\n\s*y: data\.y,\n\s*facingRight: data\.facingRight,\n\s*vx: data\.vx,\n\s*vy: data\.vy\n\s*\};/, 
`activeRooms[currentRoom].players[socket.id] = {
          id: socket.id,
          name: data.name || activeRooms[currentRoom].players[socket.id]?.name || 'Player',
          x: data.x,
          y: data.y,
          facingRight: data.facingRight,
          vx: data.vx,
          vy: data.vy
        };`);

// Also we should handle relaying notifications for gangs and trades in server.ts
const eventsLogic = `
    socket.on('send_trade_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('trade_request', { senderId: socket.id, senderName });
       }
    });
    
    socket.on('send_gang_invite', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('gang_invite', { senderId: socket.id, senderName });
       }
    });
`;
code = code.replace(/socket\.on\('disconnect', \(\) => \{/, eventsLogic + "\n    socket.on('disconnect', () => {");

fs.writeFileSync('server.ts', code);

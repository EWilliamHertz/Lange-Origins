import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// Update join_room
code = code.replace(/socket\.on\('join_room', \(roomId: string\) => \{/, "socket.on('join_room', (data: { roomId: string, nickname?: string } | string) => { const roomId = typeof data === 'string' ? data : data.roomId; const nickname = typeof data === 'string' ? 'Player' : (data.nickname || 'Player');");
code = code.replace(/activeRooms\[roomId\]\.players\[socket\.id\] = \{ x: 100, y: 100, vx: 0, vy: 0, facingRight: true \};/, "activeRooms[roomId].players[socket.id] = { x: 100, y: 100, vx: 0, vy: 0, facingRight: true, name: nickname };");

// Update chat_message
code = code.replace(/sender: socket\.id\.substring\(0, 4\)/, "sender: activeRooms[currentRoom]?.players[socket.id]?.name || socket.id.substring(0, 4)");

// Update player_update
code = code.replace(/activeRooms\[currentRoom\]\.players\[socket\.id\] = \{[\s\S]*?\};/, "activeRooms[currentRoom].players[socket.id] = { ...activeRooms[currentRoom].players[socket.id], ...data };");

fs.writeFileSync('server.ts', code);

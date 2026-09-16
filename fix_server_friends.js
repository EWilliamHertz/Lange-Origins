import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const srvOld = `    socket.on('send_gang_invite', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('gang_invite', { senderId: socket.id, senderName });
       }
    });`;

const srvNew = `    socket.on('send_gang_invite', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('gang_invite', { senderId: socket.id, senderName });
       }
    });
    
    socket.on('send_friend_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('friend_request', { senderId: socket.id, senderName });
       }
    });`;

code = code.replace(srvOld, srvNew);
fs.writeFileSync('server.ts', code);

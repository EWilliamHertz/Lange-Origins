const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const duelHandlers = `
    socket.on('send_duel_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('duel_request', { senderId: socket.id, senderName });
       }
    });
    socket.on('accept_duel', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               // Initiate Duel (Turn on PvP for both towards each other)
               io.to(data.senderId).emit('duel_started', { opponentId: socket.id, opponentName: room.players[socket.id].name });
               io.to(socket.id).emit('duel_started', { opponentId: data.senderId, opponentName: room.players[data.senderId].name });
           }
       }
    });
`;

code = code.replace("    socket.on('send_friend_request', (data: { targetId: string }) => {", duelHandlers + "\n    socket.on('send_friend_request', (data: { targetId: string }) => {");

fs.writeFileSync('server.ts', code);
console.log("Server patched.");

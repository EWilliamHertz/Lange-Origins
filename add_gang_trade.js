import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const tradeGangLogic = `
    socket.on('accept_gang_invite', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               let gangId = room.players[data.senderId].gangId;
               if (!gangId) {
                   gangId = "gang_" + data.senderId;
                   room.players[data.senderId].gangId = gangId;
                   room.gangs[gangId] = { id: gangId, members: [data.senderId] };
               }
               
               if (!room.gangs[gangId].members.includes(socket.id)) {
                   room.gangs[gangId].members.push(socket.id);
               }
               room.players[socket.id].gangId = gangId;
               
               // Broadcast gang update to members
               room.gangs[gangId].members.forEach(memberId => {
                   io.to(memberId).emit('gang_update', room.gangs[gangId]);
               });
           }
       }
    });

    socket.on('accept_trade_request', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               const tradeId = "trade_" + data.senderId + "_" + socket.id;
               room.trades[tradeId] = {
                   id: tradeId,
                   p1: data.senderId,
                   p2: socket.id,
                   p1Items: Array(9).fill(null),
                   p2Items: Array(9).fill(null),
                   p1Confirm: false,
                   p2Confirm: false
               };
               io.to(data.senderId).emit('trade_started', { tradeId, peerId: socket.id, peerName: room.players[socket.id].name, role: 'p1' });
               io.to(socket.id).emit('trade_started', { tradeId, peerId: data.senderId, peerName: room.players[data.senderId].name, role: 'p2' });
           }
       }
    });
    
    socket.on('update_trade_item', (data: { tradeId: string, role: 'p1'|'p2', index: number, item: any }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               if (data.role === 'p1') {
                   trade.p1Items[data.index] = data.item;
                   trade.p1Confirm = false;
                   trade.p2Confirm = false;
               } else {
                   trade.p2Items[data.index] = data.item;
                   trade.p1Confirm = false;
                   trade.p2Confirm = false;
               }
               io.to(trade.p1).emit('trade_updated', trade);
               io.to(trade.p2).emit('trade_updated', trade);
           }
       }
    });

    socket.on('toggle_trade_confirm', (data: { tradeId: string, role: 'p1'|'p2' }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               if (data.role === 'p1') trade.p1Confirm = !trade.p1Confirm;
               else trade.p2Confirm = !trade.p2Confirm;
               
               if (trade.p1Confirm && trade.p2Confirm) {
                   // Complete trade
                   io.to(trade.p1).emit('trade_completed', { itemsReceived: trade.p2Items });
                   io.to(trade.p2).emit('trade_completed', { itemsReceived: trade.p1Items });
                   delete activeRooms[currentRoom].trades[data.tradeId];
               } else {
                   io.to(trade.p1).emit('trade_updated', trade);
                   io.to(trade.p2).emit('trade_updated', trade);
               }
           }
       }
    });
    
    socket.on('cancel_trade', (data: { tradeId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               io.to(trade.p1).emit('trade_cancelled', { returnedItems: trade.p1Items });
               io.to(trade.p2).emit('trade_cancelled', { returnedItems: trade.p2Items });
               delete activeRooms[currentRoom].trades[data.tradeId];
           }
       }
    });
`;

code = code.replace(/socket\.on\('send_gang_invite', \(data: \{ targetId: string \}\) => \{[\s\S]*?\}\);\n/, 
  "socket.on('send_gang_invite', (data: { targetId: string }) => {\n       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {\n           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';\n           io.to(data.targetId).emit('gang_invite', { senderId: socket.id, senderName });\n       }\n    });\n" + tradeGangLogic);

fs.writeFileSync('server.ts', code);

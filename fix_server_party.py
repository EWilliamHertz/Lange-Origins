lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "socket.on('accept_party_invite'" in lines[i]:
        insert = """
    socket.on('queue_instance', (data: { instanceId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player) {
               if (player.partyId && room.parties[player.partyId]) {
                   const party = room.parties[player.partyId];
                   party.queueingFor = data.instanceId;
                   party.readyCheck = {};
                   party.members.forEach(mId => {
                       party.readyCheck[mId] = false;
                       io.to(mId).emit('party_ready_check', { instanceId: data.instanceId });
                   });
               } else {
                   // Solo queue
                   socket.emit('instance_joined', { instanceId: data.instanceId + '_' + Date.now() });
               }
           }
       }
    });

    socket.on('accept_ready_check', () => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player && player.partyId && room.parties[player.partyId]) {
               const party = room.parties[player.partyId];
               if (party.readyCheck) {
                   party.readyCheck[socket.id] = true;
                   
                   // Check if everyone is ready
                   const allReady = party.members.every(mId => party.readyCheck[mId]);
                   if (allReady) {
                       const instanceId = party.queueingFor + '_' + Date.now();
                       party.members.forEach(mId => {
                           io.to(mId).emit('instance_joined', { instanceId });
                       });
                       delete party.queueingFor;
                       delete party.readyCheck;
                   } else {
                       party.members.forEach(mId => {
                           io.to(mId).emit('party_update', party);
                       });
                   }
               }
           }
       }
    });

    socket.on('decline_ready_check', () => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player && player.partyId && room.parties[player.partyId]) {
               const party = room.parties[player.partyId];
               if (party.readyCheck) {
                   delete party.queueingFor;
                   delete party.readyCheck;
                   party.members.forEach(mId => {
                       io.to(mId).emit('ready_check_cancelled');
                       io.to(mId).emit('party_update', party);
                   });
               }
           }
       }
    });
"""
        lines.insert(i, insert)
        break
open('server.ts', 'w').write('\n'.join(lines))

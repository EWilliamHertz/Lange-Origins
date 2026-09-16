import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const whisperCode = `
    socket.on('chat_message', (message: string) => {
      if (!currentRoom) return;
      const room = activeRooms[currentRoom];
      const player = room?.players[socket.id];
      if (!player) return;

      if (message.startsWith('/w ')) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
           const targetName = parts[1].toLowerCase();
           const whisperMsg = parts.slice(2).join(' ');
           
           let targetSocketId = null;
           let actualTargetName = '';
           for (const p of Object.values(room.players)) {
              if (p.name.toLowerCase() === targetName) {
                 targetSocketId = p.id;
                 actualTargetName = p.name;
                 break;
              }
           }
           if (targetSocketId) {
              io.to(targetSocketId).emit('chat_message', { id: socket.id, name: player.name, message: \`(Whisper from \${player.name}): \${whisperMsg}\` });
              socket.emit('chat_message', { id: socket.id, name: player.name, message: \`(Whisper to \${actualTargetName}): \${whisperMsg}\` });
           } else {
              socket.emit('chat_message', { id: 'system', name: 'System', message: \`Player \${parts[1]} not found.\` });
           }
        }
      } else {
        io.to(currentRoom).emit('chat_message', { id: socket.id, name: player.name, message });
      }
    });
`;

code = code.replace(/socket\.on\('chat_message', \(message: string\) => \{[\s\S]*?\}\n\s*\}\);/, whisperCode);
fs.writeFileSync('server.ts', code);

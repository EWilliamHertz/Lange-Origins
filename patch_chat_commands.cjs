const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    socket.on('chat_message', (message: string) => {
      if (!currentRoom) return;
      const room = activeRooms[currentRoom];
      const player = room?.players[socket.id];
      if (!player) return;

      if (message.startsWith('/give ')) {
        const parts = message.split(' ');
        if (parts.length >= 2) {
           const typeStr = parts[1];
           let typeId = parseInt(typeStr);
           const count = parts[2] ? parseInt(parts[2]) : 1;
           if (!isNaN(typeId)) {
               // Give item directly to player by spawning it exactly on top of them (fastest way to give without a complex direct inventory packet)
               const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random()*1000);
               activeRooms[currentRoom].items[itemId] = {
                   id: itemId, type: typeId, count: count, x: player.x, y: player.y, vx: 0, vy: -5
               };
               socket.emit('chat_message', { id: 'system', name: 'System', message: \`Spawned item \${typeId} x\${count}.\` });
           }
        }
        return;
      }
      
      if (message.startsWith('/spawn')) {
         socket.emit('teleport', { x: 4000, y: 1000 }); // Will teleport player and let physics drop them to spawn
         socket.emit('chat_message', { id: 'system', name: 'System', message: \`Teleported to spawn.\` });
         return;
      }

      if (message.startsWith('/w ') || message.startsWith('/whisper ')) {
`;

code = code.replace(/    socket\.on\('chat_message', \(message: string\) => \{[\s\S]*?if \(message\.startsWith\('\/w '\) \|\| message\.startsWith\('\/whisper '\)\) \{/, replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('Chat commands patched.');

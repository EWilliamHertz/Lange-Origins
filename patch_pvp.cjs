const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hitPlayerHandlers = `
    socket.on('hit_player', (data: { targetId: string, damage: number, facingRight: boolean }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const targetPlayer = room.players[data.targetId];
        if (targetPlayer) {
            // Apply damage locally on their client
            io.to(data.targetId).emit('take_damage', { amount: data.damage || 5, facingRight: data.facingRight });
            // Emit damage indicator
            io.to(currentRoom).emit('damage_indicator', {
                id: Math.random().toString(),
                x: targetPlayer.x,
                y: targetPlayer.y,
                damage: data.damage || 5
            });
        }
      }
    });
`;
code = code.replace("    socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean }) => {", hitPlayerHandlers + "\n    socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean }) => {");
fs.writeFileSync('server.ts', code);
console.log("PvP patched in server.");

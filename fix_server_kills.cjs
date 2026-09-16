const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean }) => {",
  "socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean, playerId?: string }) => {"
);

code = code.replace(
  "m.vx = (m.x > hitX) ? 8 : (m.x < hitX) ? -8 : (data.facingRight ? 8 : -8);",
  "m.vx = (m.x > hitX) ? 8 : (m.x < hitX) ? -8 : (data.facingRight ? 8 : -8);\n              m.lastHitBy = data.playerId;"
);

// inside interval, where hp <= 0
code = code.replace(
  "io.to(roomId).emit('chat_message', { sender: 'System', text: 'A Giant Golem has been defeated!' });",
  "io.to(roomId).emit('chat_message', { sender: 'DUREL', text: 'THE CHAMPION HAS SLAIN A MIGHTY BOSS!!!' });"
);

code = code.replace(
  "          if (dropType !== 0) {",
  "          io.to(roomId).emit('mob_killed', { mobId: mob.id, type: mob.type, killerId: mob.lastHitBy });\n          if (dropType !== 0) {"
);

fs.writeFileSync('server.ts', code);
console.log('Added kill tracking to server');

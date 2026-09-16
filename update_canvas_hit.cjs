const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "state.socket.emit('hit_mob', { mobId, damage: dmg, facingRight: player.x < mob.x });",
  "state.socket.emit('hit_mob', { mobId, damage: dmg, facingRight: player.x < mob.x, playerId: state.socket.id });"
);

// and for ranged weapons (bow/gun):
code = code.replace(
  "socket.emit('hit_mob', { mobId: hitMobId, damage: dmg, facingRight: vx > 0 });",
  "socket.emit('hit_mob', { mobId: hitMobId, damage: dmg, facingRight: vx > 0, playerId: socket.id });"
);
code = code.replace(
  "state.socket.emit('hit_mob', { mobId: m.id, damage: 15, facingRight: true });",
  "state.socket.emit('hit_mob', { mobId: m.id, damage: 15, facingRight: true, playerId: state.socket.id });"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Added playerId to hit_mob calls');

lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "} else if (data.ability === 'whirlwind') {" in lines[i]:
        insert = """
      } else if (data.ability === 'ground_slam') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const range = 80;
          const damage = 35;
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              const dist = Math.hypot(m.x - player.x, m.y - player.y);
              if (dist < range) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -7;
                  m.vx = (m.x > player.x) ? 3 : -3;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage });
              }
          }
      } else if (data.ability === 'battle_shout') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });
          player.hp = Math.min(100, (player.hp || 100) + 15);
          socket.emit('heal', { amount: 15 });
          // could add buff later
      } else if (data.ability === 'teleport') {
          player.x += data.facingRight ? 120 : -120;
          // clamp to world
          player.x = Math.max(32, Math.min(player.x, 990 * 32));
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });
"""
        lines.insert(i, insert)
        break

open('server.ts', 'w').write('\n'.join(lines))

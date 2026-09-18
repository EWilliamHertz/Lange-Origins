lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "              if (m.x < hitBox.x + hitBox.w && m.x + 24 > hitBox.x && m.y < hitBox.y + hitBox.h && m.y + 24 > hitBox.y) {" in lines[i]:
        insert_code = """
          }
      } else if (data.ability === 'whirlwind') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const range = 60;
          const damage = 25;
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              const dist = Math.hypot(m.x - player.x, m.y - player.y);
              if (dist < range) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -5;
                  m.vx = (m.x > player.x) ? 6 : -6;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage });
              }
          }
      } else if (data.ability === 'trap') {
          const id = 'trap_' + Date.now();
          room.projectiles[id] = {
              id, type: 'trap', owner: socket.id,
              x: player.x, y: player.y,
              vx: 0, vy: 0, damage: 30,
              life: 1000 // lives for long
          };
        """
        # we need to just insert after the slash loop
        end_idx = i
        while "}" not in lines[end_idx+2]:
            end_idx += 1
        lines.insert(end_idx + 3, insert_code)
        break

open('server.ts', 'w').write('\n'.join(lines))

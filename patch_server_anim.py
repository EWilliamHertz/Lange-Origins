import re
with open('server.ts', 'r') as f:
    content = f.read()

anim_handler = """    socket.on('use_ability', (data: { ability: string, targetId?: string, targetType?: string, facingRight?: boolean }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      if (!player) return;

      if (data.ability === 'heal') {
          player.hp = Math.min(100, (player.hp || 100) + 20);
          socket.emit('heal', { amount: 20 });
          // Broadcast animation
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });
      } else if (data.ability === 'slash') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          // Server-side slash damage
          const range = 60;
          const damage = 15;
          const hitBox = {
              x: data.facingRight ? player.x : player.x - range,
              y: player.y - 10,
              w: range + 24,
              h: 46
          };
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              if (m.x < hitBox.x + hitBox.w && m.x + 24 > hitBox.x && m.y < hitBox.y + hitBox.h && m.y + 24 > hitBox.y) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -4;
                  m.vx = data.facingRight ? 5 : -5;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage });
              }
          }
      } else if (data.ability === 'fireball' && data.targetId && data.targetType) {
          const targetObj = data.targetType === 'mob' ? room.mobs[data.targetId] : room.players[data.targetId];
          if (targetObj) {
              const damage = 25;
              targetObj.hp -= damage;
              io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: targetObj.x, y: targetObj.y, damage });
              if (data.targetType === 'mob') {
                  const m = targetObj as any;
                  m.vy = -6;
                  m.vx = (player.x < m.x) ? 8 : -8;
                  m.lastHitBy = socket.id;
              }
          }
      }
    });"""

content = re.sub(r"    socket\.on\('use_ability'.+?    \}\);", anim_handler, content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)

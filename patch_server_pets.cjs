const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add dropperId to dropped items
code = code.replace(
  "        vy: -5",
  "        vy: -5,\n        dropperId: socket.id"
);

// Add wolf spawning in mob spawning logic (10% chance instead of regular mobs)
code = code.replace(
  "const type = Math.random() > 0.8 ? 'creeper' : (Math.random() > 0.5 ? 'skeleton' : 'zombie');",
  "const r = Math.random();\n        let type = r > 0.9 ? 'wolf' : (r > 0.8 ? 'creeper' : (r > 0.4 ? 'skeleton' : 'zombie'));"
);

// Server AI loop modification
const aiLogic = `
        // Normal AI Movement or Knockback
        if (mob.ownerId) {
            // Pet AI
            const owner = room.players[mob.ownerId];
            if (owner) {
                const distToOwner = Math.sqrt(Math.pow(mob.x - owner.x, 2) + Math.pow(mob.y - owner.y, 2));
                
                // Find nearest hostile mob
                let targetMob = null;
                let closestDist = 200; // Attack range
                for (const tmId in room.mobs) {
                    const tm = room.mobs[tmId];
                    if (tmId !== mobId && !tm.ownerId) {
                        const dist = Math.sqrt(Math.pow(mob.x - tm.x, 2) + Math.pow(mob.y - tm.y, 2));
                        if (dist < closestDist) {
                            closestDist = dist;
                            targetMob = tm;
                        }
                    }
                }

                if (targetMob) {
                    // Attack target
                    if (closestDist < 40) {
                       targetMob.hp -= 2;
                       targetMob.vx = mob.x < targetMob.x ? 5 : -5;
                       targetMob.vy = -3;
                       mob.vx = mob.x < targetMob.x ? 1 : -1;
                    } else {
                       mob.vx = mob.x < targetMob.x ? 4 : -4;
                    }
                    mob.facingRight = mob.vx > 0;
                } else if (distToOwner > 60) {
                    // Follow owner
                    mob.vx = mob.x < owner.x ? 4 : -4;
                    mob.facingRight = mob.vx > 0;
                } else {
                    mob.vx *= 0.5;
                }
            } else {
               mob.vx = 0; // owner offline
            }
        } else if (Math.abs(mob.vx) > 3) {
          mob.vx *= 0.8; // friction if knocked back
        } else {
          mob.vx = mob.facingRight ? 2 : -2;
        }
`;

code = code.replace(
  /        \/\/ Normal AI Movement or Knockback[\s\S]*?mob\.vx = mob\.facingRight \? 2 : -2;\n        \}/,
  aiLogic.trim()
);

// Add taming logic to item loop
const itemLoopPatch = `
      let itemsUpdated = false;
      for (const itemId in room.items) {
        const item = room.items[itemId];
        if (!item) continue;
        
        // Taming logic
        if ((item.type === 403 || item.type === 201 || item.type === 202) && item.dropperId) {
            for (const mId in room.mobs) {
                const m = room.mobs[mId];
                if (m.type === 'wolf' && !m.ownerId) {
                    const dist = Math.sqrt(Math.pow(m.x - item.x, 2) + Math.pow(m.y - item.y, 2));
                    if (dist < 40) {
                        m.ownerId = item.dropperId;
                        m.hp = 50; // Heal when tamed
                        delete room.items[itemId];
                        const ownerName = room.players[item.dropperId]?.name || 'Someone';
                        io.to(roomId).emit('chat_message', { sender: 'System', text: ownerName + ' tamed a wolf!' });
                        break;
                    }
                }
            }
        }
`;
code = code.replace(
  "let itemsUpdated = false;\n      for (const itemId in room.items) {\n        const item = room.items[itemId];",
  itemLoopPatch.trim()
);

fs.writeFileSync('server.ts', code);
console.log('Server pets logic patched.');

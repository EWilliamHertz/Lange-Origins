import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
        if (mob.hp <= 0) {
          // Drop items based on mob type
          let dropType = 0;
          let dropAmount = 1;
          if (mob.type === 'skeleton') {
              dropType = Math.random() > 0.5 ? 403 : 107; // 403 = Bone, 107 = Arrow
              dropAmount = Math.floor(Math.random() * 3) + 1;
          } else if (mob.type === 'creeper') {
              dropType = 402; // Gunpowder
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'zombie') {
              dropType = 1; // Dirt (placeholder for rotten flesh)
          }

          if (dropType !== 0) {
              for(let i = 0; i < dropAmount; i++) {
                 const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                 room.items[id] = { 
                     id, 
                     type: dropType, 
                     x: mob.x + Math.random() * 16 - 8, 
                     y: mob.y + Math.random() * 16 - 8, 
                     vx: (Math.random() - 0.5) * 4, 
                     vy: -3 - Math.random() * 3 
                 };
                 itemsUpdated = true;
              }
          }
          
          delete room.mobs[mobId];
          mobsUpdated = true;
          continue;
        }
`;

code = code.replace(/if \(mob\.hp <= 0\) \{\s*delete room\.mobs\[mobId\];\s*mobsUpdated = true;\s*continue;\s*\}/, replacement);
fs.writeFileSync('server.ts', code);

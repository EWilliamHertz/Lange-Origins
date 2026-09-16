import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const spawnOld = `      // Spawn new mobs occasionally
      if (Object.keys(room.mobs).length < 5 && Math.random() < 0.05) {
        const spawnX = Math.floor(room.world.length / 2) + Math.floor((Math.random() - 0.5) * 40);
        let spawnY = 0;
        while (spawnY < room.world[0].length && room.world[spawnX][spawnY] === 0) {
          spawnY++;
        }
        
        const elapsedMs = Date.now() - room.createdAt;
        const timeOfDay = (0.35 + elapsedMs * 0.00001) % 1.0;
        const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
        
        const typesNight = ['skeleton', 'creeper', 'zombie'];
        const type = isNight ? typesNight[Math.floor(Math.random() * typesNight.length)] : 'slime';`;
        
const spawnNew = `      // Spawn new mobs occasionally
      if (Object.keys(room.mobs).length < 6 && Math.random() < 0.05) {
        let spawnX = Math.floor(room.world.length / 2) + Math.floor((Math.random() - 0.5) * 40);
        let spawnY = 0;
        
        // 5% chance to try spawning a boss in the deep underground
        const isBossSpawn = Math.random() < 0.05;
        let type = 'slime';
        
        if (isBossSpawn) {
           spawnX = Math.floor(Math.random() * room.world.length);
           spawnY = room.world[0].length - Math.floor(Math.random() * 40) - 10; // Deep underground
           type = 'golem_boss';
        } else {
           while (spawnY < room.world[0].length && room.world[spawnX][spawnY] === 0) {
             spawnY++;
           }
           const elapsedMs = Date.now() - room.createdAt;
           const timeOfDay = (0.35 + elapsedMs * 0.00001) % 1.0;
           const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
           const typesNight = ['skeleton', 'creeper', 'zombie'];
           type = isNight ? typesNight[Math.floor(Math.random() * typesNight.length)] : 'slime';
        }`;

code = code.replace(spawnOld, spawnNew);

const mobInitOld = `        room.mobs[mobId] = {
          id: mobId,
          type: type,
          x: spawnX * 32,
          y: (spawnY - 2) * 32,
          vx: 0, vy: 0, hp: 10, facingRight: Math.random() > 0.5
        };`;

const mobInitNew = `        room.mobs[mobId] = {
          id: mobId,
          type: type,
          x: spawnX * 32,
          y: (spawnY - (type === 'golem_boss' ? 4 : 2)) * 32,
          vx: 0, vy: 0, hp: type === 'golem_boss' ? 300 : 10, 
          facingRight: Math.random() > 0.5
        };`;

code = code.replace(mobInitOld, mobInitNew);

const mobLootOld = `          } else if (mob.type === 'creeper') {
              dropType = 402; // Gunpowder
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'zombie') {
              dropType = 1; // Dirt (placeholder for rotten flesh)
          }

          if (dropType !== 0) {`;

const mobLootNew = `          } else if (mob.type === 'creeper') {
              dropType = 402; // Gunpowder
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'zombie') {
              dropType = 1; // Dirt (placeholder for rotten flesh)
          } else if (mob.type === 'golem_boss') {
              dropType = 405; // Boss Relic
              dropAmount = 1;
              io.to(roomId).emit('chat_message', { sender: 'System', text: 'A Giant Golem has been defeated!' });
          }

          if (dropType !== 0) {`;

code = code.replace(mobLootOld, mobLootNew);

fs.writeFileSync('server.ts', code);

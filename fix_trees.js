import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

const treeOld = `    if (y < WORLD_HEIGHT && world[x][y] === BlockType.Grass) {
      const moisture = moistureNoise.get(x * 0.002);
      const isForest = moisture > -0.1;
      const treeChance = isForest ? 0.65 : 0.15;
      
      let nearbyWood = false;
      for (let dx = -3; dx <= 3; dx++) {
         if (x + dx >= 0 && x + dx < WORLD_WIDTH && world[x + dx][y - 1] === BlockType.Wood) {
            nearbyWood = true;
         }
      }
      
      if (random() < treeChance && !nearbyWood) {`;

const treeNew = `    if (y < WORLD_HEIGHT && (world[x][y] === BlockType.Grass || world[x][y] === BlockType.Dirt)) {
      const treeChance = 0.25; // 25% chance of tree on any grass/dirt
      
      let nearbyWood = false;
      for (let dx = -2; dx <= 2; dx++) {
         if (x + dx >= 0 && x + dx < WORLD_WIDTH && y > 0 && world[x + dx][y - 1] === BlockType.Wood) {
            nearbyWood = true;
         }
      }
      
      if (random() < treeChance && !nearbyWood) {`;

code = code.replace(treeOld, treeNew);
fs.writeFileSync('src/lib/world.ts', code);

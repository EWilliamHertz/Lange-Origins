import fs from 'fs';
let codeConstants = fs.readFileSync('src/lib/constants.ts', 'utf8');
codeConstants = codeConstants.replace(/Ice = 204\n\}/, "Ice = 204,\n  Cactus = 205\n}");
codeConstants = codeConstants.replace(/\[BlockType\.Ice\]: '#B3E5FC'/, "[BlockType.Ice]: '#B3E5FC',\n  [BlockType.Cactus]: '#43A047'");
codeConstants = codeConstants.replace(/\[BlockType\.Ice\]: 1/, "[BlockType.Ice]: 1,\n  [BlockType.Cactus]: 0.5");
codeConstants = codeConstants.replace(/\[BlockType\.Ice\]: 'Ice'/, "[BlockType.Ice]: 'Ice',\n  [BlockType.Cactus]: 'Cactus'");
fs.writeFileSync('src/lib/constants.ts', codeConstants);

let codeWorld = fs.readFileSync('src/lib/world.ts', 'utf8');

const treeGeneration = `
    if (y < WORLD_HEIGHT && world[x][y] === BlockType.Grass) {
      const moisture = moistureNoise.get(x * 0.02);
      const isForest = moisture > -0.1;
      const treeChance = isForest ? 0.65 : 0.15;
      if (random() < treeChance && world[x-1][y-1] !== BlockType.Wood && world[x-2][y-1] !== BlockType.Wood) {
        const treeHeight = Math.floor(random() * 3) + 4;
        
        // Trunk
        for (let i = 0; i < treeHeight; i++) {
          if (y - 1 - i >= 0) world[x][y - 1 - i] = BlockType.Wood;
        }
        
        // Leaves
        const leafCenterY = y - treeHeight;
        for (let lx = x - 2; lx <= x + 2; lx++) {
          for (let ly = leafCenterY - 2; ly <= leafCenterY + 1; ly++) {
            if (Math.abs(lx - x) + Math.abs(ly - leafCenterY) <= 2.5) {
              if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                if (world[lx][ly] === BlockType.Air) {
                  world[lx][ly] = BlockType.Leaves;
                }
              }
            }
          }
        }
      }
    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Sand) {
      // Cactus in desert
      const moisture = moistureNoise.get(x * 0.02);
      const temperature = temperatureNoise.get(x * 0.015);
      const isCold = temperature < -0.3;
      
      if (!isCold && random() < 0.05 && world[x-1][y-1] !== BlockType.Cactus) {
         const cactusHeight = Math.floor(random() * 3) + 2;
         for (let i = 0; i < cactusHeight; i++) {
            if (y - 1 - i >= 0) world[x][y - 1 - i] = BlockType.Cactus;
         }
      }
    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Snow) {
      // Ice Spikes in snow
      if (random() < 0.02 && world[x-1][y-1] !== BlockType.Ice) {
         const spikeHeight = Math.floor(random() * 5) + 3;
         for (let i = 0; i < spikeHeight; i++) {
            if (y - 1 - i >= 0) {
               world[x][y - 1 - i] = BlockType.Ice;
               // make it thick at bottom
               if (i < 2) {
                  if (x > 0 && world[x-1][y - 1 - i] === BlockType.Air) world[x-1][y - 1 - i] = BlockType.Ice;
                  if (x < WORLD_WIDTH-1 && world[x+1][y - 1 - i] === BlockType.Air) world[x+1][y - 1 - i] = BlockType.Ice;
               }
            }
         }
      }
    }
`;

codeWorld = codeWorld.replace(/if \(y < WORLD_HEIGHT && world\[x\]\[y\] === BlockType\.Grass\) \{[\s\S]*?\}\n\s*\}\n\s*\}\n\s*\}\n\s*\}/, treeGeneration);
fs.writeFileSync('src/lib/world.ts', codeWorld);

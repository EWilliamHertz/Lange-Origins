import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

const worldGenOld = `        // Generate base terrain
        if (y < surfaceLevel) {
          world[x][y] = BlockType.Air;
        } else if (y === surfaceLevel) {
          // Surface details based on biomes
          if (temperature < -0.3) {
            world[x][y] = BlockType.Snow;
          } else if (moisture < -0.4) {
            world[x][y] = BlockType.Sand;
          } else {
            world[x][y] = BlockType.Grass;
          }
        } else if (y > surfaceLevel && y < surfaceLevel + 3) {
           if (moisture < -0.4 && temperature >= -0.3) {
              world[x][y] = BlockType.Sand;
           } else {
              world[x][y] = BlockType.Dirt;
           }
        } else {
          world[x][y] = BlockType.Stone;
        }`;

const worldGenNew = `        // Generate base terrain
        // Calculate an underground corruption noise to make deep corrupted caves
        const isCorrupted = (y > WORLD_HEIGHT - 60) && (noise2.get(x * 0.01 + y * 0.01) > 0.3);
        
        if (y < surfaceLevel) {
          world[x][y] = BlockType.Air;
        } else if (y === surfaceLevel) {
          // Surface details based on biomes
          if (temperature < -0.3) {
            world[x][y] = BlockType.Snow;
          } else if (moisture < -0.4) {
            world[x][y] = BlockType.Sand;
          } else {
            world[x][y] = BlockType.Grass;
          }
        } else if (y > surfaceLevel && y < surfaceLevel + 3) {
           if (moisture < -0.4 && temperature >= -0.3) {
              world[x][y] = BlockType.Sand;
           } else {
              world[x][y] = BlockType.Dirt;
           }
        } else {
          if (isCorrupted) {
             world[x][y] = BlockType.CorruptedStone;
          } else {
             world[x][y] = BlockType.Stone;
          }
        }`;
        
code = code.replace(worldGenOld, worldGenNew);

fs.writeFileSync('src/lib/world.ts', code);

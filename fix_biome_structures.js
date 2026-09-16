import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// I also noticed in world.ts for cactus and pyramids I'm re-calling the noise without the new multiplier
const oldBiomeCactus = `    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Sand) {
      // Cactus in desert
      const moisture = moistureNoise.get(x * 0.002);
      const temperature = temperatureNoise.get(x * 0.0025);
      const isCold = temperature < -0.3;`;

const newBiomeCactus = `    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Sand) {
      // Cactus in desert
      const temperature = temperatureNoise.get(x * 0.005) * 1.5;
      const isCold = temperature < -0.1;`;

code = code.replace(oldBiomeCactus, newBiomeCactus);
fs.writeFileSync('src/lib/world.ts', code);

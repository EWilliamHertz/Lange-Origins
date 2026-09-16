import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// Update biome scale to be larger
code = code.replace(/const moisture = moistureNoise\.get\(x \* 0\.02\);/g, "const moisture = moistureNoise.get(x * 0.002);");
code = code.replace(/const temperature = temperatureNoise\.get\(x \* 0\.015\);/g, "const temperature = temperatureNoise.get(x * 0.0025);");

// Enhance caves
const newCaves = `
  // Add some simple caves using simple random walk
  for (let i = 0; i < 80; i++) {
    let cx = Math.floor(random() * WORLD_WIDTH);
    let cy = surfaceLevel + 25 + Math.floor(random() * (WORLD_HEIGHT - surfaceLevel - 40));
    let length = 150 + Math.floor(random() * 300); // Longer caves
    let size = 2 + random() * 4; // Thicker caves
    
    for (let j = 0; j < length; j++) {
      // Clear area around (cx, cy)
      const isize = Math.floor(size);
      for (let dx = -isize; dx <= isize; dx++) {
        for (let dy = -isize; dy <= isize; dy++) {
           if (dx*dx + dy*dy <= size*size) {
             const tx = Math.floor(cx + dx);
             const ty = Math.floor(cy + dy);
             if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                // Prevent caves from breaking the surface
                const localElev = (noise.get(tx * 0.005) * 40) + (noise2.get(tx * 0.02) * 15);
                if (ty > surfaceLevel + localElev + 12) {
                   world[tx][ty] = BlockType.Air;

                   // Bottom of deep caves might have lava
                   if (ty > WORLD_HEIGHT - 30 && dy === isize && random() < 0.3) {
                       world[tx][ty] = BlockType.Lava;
                   }
                   
                   // Occasionally spawn a chest or rare ore in caves
                   if (dy === isize && world[tx][ty] === BlockType.Air && world[tx][ty+1] === BlockType.Stone) {
                       if (random() < 0.01) {
                           world[tx][ty] = BlockType.Chest;
                       } else if (random() < 0.05) {
                           world[tx][ty] = BlockType.DiamondOre;
                       } else if (random() < 0.1) {
                           world[tx][ty] = BlockType.GoldOre;
                       }
                   }
                }
             }
           }
        }
      }
      
      // Wander
      cx += (random() - 0.5) * 5;
      cy += (random() - 0.3) * 5; // Tend to go downwards slightly
      size += (random() - 0.5) * 1.2;
      if (size < 1.5) size = 1.5;
      if (size > 8) size = 8;
      
      if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) break;
    }
  }
`;

code = code.replace(/\/\/\ Add some simple caves using simple random walk[\s\S]*?(?=\/\/\ Generate NPC Building)/, newCaves);

fs.writeFileSync('src/lib/world.ts', code);

import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// Just slice out everything between the Ice Spikes ending block and the caves.
code = code.replace(/    \} \/\/ END_ICE_SPIKE[\s\S]*?\/\/ Add some simple caves using simple random walk/, "    }\n  }\n\n  // Add some simple caves using simple random walk");

const fixed = `
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
  }

  // Add some simple caves using simple random walk
`;

code = code.replace(/    \} else if \(y < WORLD_HEIGHT && world\[x\]\[y\] === BlockType\.Snow\) \{[\s\S]*?\/\/ Add some simple caves using simple random walk/, fixed);
fs.writeFileSync('src/lib/world.ts', code);

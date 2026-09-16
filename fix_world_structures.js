import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

const anchor = `  // Add some simple caves using simple random walk`;

const structures = `  // --- Structure Pass ---
  for (let x = 20; x < WORLD_WIDTH - 20; x += 40 + Math.floor(random() * 60)) {
     // Find surface
     let y = 0;
     while(y < WORLD_HEIGHT && world[x][y] === BlockType.Air) y++;
     
     if (y < WORLD_HEIGHT) {
         if (world[x][y] === BlockType.Sand) {
            // Check if flat enough
            let flat = true;
            for(let dx=-5; dx<=5; dx++) {
               let sy = 0;
               while(sy < WORLD_HEIGHT && world[x+dx][sy] === BlockType.Air) sy++;
               if (Math.abs(sy - y) > 2 || world[x+dx][sy] !== BlockType.Sand) flat = false;
            }
            if (flat) {
               // Build pyramid
               for (let h = 0; h < 6; h++) {
                  for (let dx = -(5-h); dx <= (5-h); dx++) {
                     world[x+dx][y - 1 - h] = BlockType.Sand;
                     // also clear above
                     for (let cy = y - 2 - h; cy > Math.max(0, y - 10); cy--) {
                         world[x+dx][cy] = BlockType.Air;
                     }
                  }
               }
               // Hollow center and chest
               world[x][y-1] = BlockType.Air;
               world[x][y-2] = BlockType.Air;
               world[x][y-3] = BlockType.Air;
               world[x][y-1] = BlockType.Chest;
               
               x += 30;
            }
         } else if (world[x][y] === BlockType.Snow) {
            // Build snow ruins
            let flat = true;
            for(let dx=-4; dx<=4; dx++) {
               let sy = 0;
               while(sy < WORLD_HEIGHT && world[x+dx][sy] === BlockType.Air) sy++;
               if (Math.abs(sy - y) > 3 || world[x+dx][sy] !== BlockType.Snow) flat = false;
            }
            if (flat) {
               for(let dx=-4; dx<=4; dx++) {
                  if (Math.abs(dx) === 4 || Math.abs(dx) === 3) {
                     let h = Math.floor(random() * 4) + 2;
                     for(let i=0; i<h; i++) {
                        world[x+dx][y - 1 - i] = BlockType.Stone; // Stone ruins in snow
                     }
                  } else {
                     world[x+dx][y - 1] = BlockType.Stone;
                  }
               }
               world[x][y-2] = BlockType.Chest;
               world[x][y-1] = BlockType.Air;
               world[x][y-3] = BlockType.Air;
               x += 30;
            }
         }
     }
  }

  // Add some simple caves using simple random walk`;

code = code.replace(anchor, structures);
fs.writeFileSync('src/lib/world.ts', code);

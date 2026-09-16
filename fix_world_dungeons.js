import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

const anchor = `  // Add some simple caves using simple random walk`;
const replacement = `  // --- Dungeon Pass ---
  for (let i = 0; i < 30; i++) {
     let dx = 10 + Math.floor(random() * (WORLD_WIDTH - 20));
     let dy = surfaceLevel + 30 + Math.floor(random() * (WORLD_HEIGHT - surfaceLevel - 40));
     
     // 7x7 room
     for (let rx = -4; rx <= 4; rx++) {
        for (let ry = -4; ry <= 4; ry++) {
           let tx = dx + rx;
           let ty = dy + ry;
           if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
              if (Math.abs(rx) === 4 || Math.abs(ry) === 4) {
                 world[tx][ty] = BlockType.AdminBrick; // Unbreakable walls, or maybe just stone? Let's use Stone or a new block. We have AdminBrick, but let's use Stone with Mossy variants if we had one. Just Stone is fine, but maybe Wood? Let's use Wood for mine shafts, AdminBrick for dungeons? AdminBrick is unbreakable. Let's use Stone for walls, but place chests inside.
                 world[tx][ty] = BlockType.Stone; 
              } else {
                 world[tx][ty] = BlockType.Air;
              }
           }
        }
     }
     // Add chest and spawners (maybe just a mob will spawn naturally, but we can put some iron/gold blocks or a chest)
     if (dx >= 0 && dx < WORLD_WIDTH && dy >= 0 && dy < WORLD_HEIGHT) {
        world[dx][dy + 3] = BlockType.Chest;
        world[dx - 2][dy + 3] = BlockType.IronOre;
        world[dx + 2][dy + 3] = BlockType.GoldOre;
     }
  }

  // Add some simple caves using simple random walk`;

code = code.replace(anchor, replacement);
fs.writeFileSync('src/lib/world.ts', code);

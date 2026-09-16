const fs = require('fs');
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

code = code.replace(
  "else if (depth > 40 && Math.abs(oreNoiseDiamond.get((x + y * WORLD_WIDTH) * 0.2)) > 0.96) {\n            world[x][y] = BlockType.DiamondOre;\n        }",
  "else if (depth > 40 && Math.abs(oreNoiseDiamond.get((x + y * WORLD_WIDTH) * 0.2)) > 0.96) {\n            world[x][y] = BlockType.DiamondOre;\n        }\n        // Blue Crystal: deep magic ore\n        else if (depth > 30 && Math.abs(oreNoiseDiamond.get((x + y * WORLD_WIDTH) * 0.17)) > 0.95) {\n            world[x][y] = BlockType.BlueCrystal;\n        }"
);

code = code.replace(
  "world[tx][ty] = BlockType.DiamondOre;\n                       } else if (random() < 0.1) {",
  "world[tx][ty] = BlockType.DiamondOre;\n                       } else if (random() < 0.05) {\n                           world[tx][ty] = BlockType.BlueCrystal;\n                       } else if (random() < 0.1) {"
);

fs.writeFileSync('src/lib/world.ts', code);
console.log('Map generation patched.');

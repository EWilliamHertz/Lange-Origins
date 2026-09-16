const fs = require('fs');

let constants = fs.readFileSync('src/lib/constants.ts', 'utf8');

constants = constants.replace(
  "  Cactus = 205,",
  "  Cactus = 205,\n  TreeSeed = 206,"
);

constants = constants.replace(
  "  [BlockType.Cactus]: 'Cactus',",
  "  [BlockType.Cactus]: 'Cactus',\n  [BlockType.TreeSeed]: 'Tree Seed',"
);

constants = constants.replace(
  "  [BlockType.Cactus]: '#2E7D32',",
  "  [BlockType.Cactus]: '#2E7D32',\n  [BlockType.TreeSeed]: '#8BC34A',"
);

fs.writeFileSync('src/lib/constants.ts', constants);
console.log('TreeSeed added.');

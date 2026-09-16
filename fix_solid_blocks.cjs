const fs = require('fs');

let constants = fs.readFileSync('src/lib/constants.ts', 'utf8');

constants = constants.replace(
  "  BlockType.Wood, BlockType.Leaves, BlockType.Planks, BlockType.Glass,",
  "  BlockType.Planks, BlockType.Glass,"
);

fs.writeFileSync('src/lib/constants.ts', constants);
console.log("SolidBlocks fixed.");

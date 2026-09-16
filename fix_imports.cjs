const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "import { BlockType, BlockColors, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BlockHardness } from '../lib/constants';",
  "import { BlockType, BlockColors, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BlockHardness, SolidBlocks } from '../lib/constants';\nconst ATTACK_RANGE = 64;"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed imports and ATTACK_RANGE');

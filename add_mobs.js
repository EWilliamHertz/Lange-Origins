import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/Arrow = 108,/, "Arrow = 108,\n  Skeleton = 200,\n  Creeper = 201,");
// For colors, maybe we don't need them since they're drawn as mobs, but let's add them just in case.
code = code.replace(/\[BlockType\.Arrow\]: '#FFFFFF',/, "[BlockType.Arrow]: '#FFFFFF',\n  [BlockType.Skeleton]: '#E0E0E0',\n  [BlockType.Creeper]: '#4CAF50',");
code = code.replace(/\[BlockType\.Arrow\]: 0,/, "[BlockType.Arrow]: 0,\n  [BlockType.Skeleton]: 0,\n  [BlockType.Creeper]: 0,");
code = code.replace(/\[BlockType\.Arrow\]: 'Arrow',/, "[BlockType.Arrow]: 'Arrow',\n  [BlockType.Skeleton]: 'Skeleton',\n  [BlockType.Creeper]: 'Creeper',");

fs.writeFileSync('src/lib/constants.ts', code);

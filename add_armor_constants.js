import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Add Armor items to enum
code = code.replace(/Ice = 204,\n\s*Cactus = 205\n\}/, "Ice = 204,\n  Cactus = 205,\n  IronHelmet = 400,\n  IronChestplate = 401\n}");

code = code.replace(/\[BlockType\.Cactus\]: '#43A047'/, "[BlockType.Cactus]: '#43A047',\n  [BlockType.IronHelmet]: '#9E9E9E',\n  [BlockType.IronChestplate]: '#BDBDBD'");
code = code.replace(/\[BlockType\.Cactus\]: 0\.5/, "[BlockType.Cactus]: 0.5,\n  [BlockType.IronHelmet]: 0,\n  [BlockType.IronChestplate]: 0");
code = code.replace(/\[BlockType\.Cactus\]: 'Cactus'/, "[BlockType.Cactus]: 'Cactus',\n  [BlockType.IronHelmet]: 'Iron Helmet',\n  [BlockType.IronChestplate]: 'Iron Chestplate'");

fs.writeFileSync('src/lib/constants.ts', code);

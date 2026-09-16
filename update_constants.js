import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Update map size
code = code.replace(/export const WORLD_WIDTH = 256;/, "export const WORLD_WIDTH = 512;");
code = code.replace(/export const WORLD_HEIGHT = 128;/, "export const WORLD_HEIGHT = 200;");

// We need to add Snow and Ice blocks
code = code.replace(/Apple = 121,/, "Apple = 121,\n  Snow = 122,\n  Ice = 123,");

code = code.replace(/\[BlockType\.Apple\]: '#F44336',/, "[BlockType.Apple]: '#F44336',\n  [BlockType.Snow]: '#FFFFFF',\n  [BlockType.Ice]: '#B3E5FC',");

code = code.replace(/\[BlockType\.Apple\]: 0,/, "[BlockType.Apple]: 0,\n  [BlockType.Snow]: 0.5,\n  [BlockType.Ice]: 1,");

code = code.replace(/\[BlockType\.Apple\]: 'Apple',/, "[BlockType.Apple]: 'Apple',\n  [BlockType.Snow]: 'Snow Block',\n  [BlockType.Ice]: 'Ice',");

code = code.replace(/BlockType\.DiamondOre, BlockType\.Furnace/, "BlockType.DiamondOre, BlockType.Furnace, BlockType.Snow, BlockType.Ice");

fs.writeFileSync('src/lib/constants.ts', code);

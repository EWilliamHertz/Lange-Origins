import fs from 'fs';
let code = fs.readFileSync('src/lib/crafting.ts', 'utf8');

const recipes = `
  {
    pattern: [
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot,
      BlockType.IronIngot, null, BlockType.IronIngot,
      null, null, null
    ],
    result: BlockType.IronHelmet,
    count: 1
  },
  {
    pattern: [
      BlockType.IronIngot, null, BlockType.IronIngot,
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot,
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot
    ],
    result: BlockType.IronChestplate,
    count: 1
  },
`;

code = code.replace(/export const RECIPES: Recipe\[\] = \[/, "export const RECIPES: Recipe[] = [\n" + recipes);
fs.writeFileSync('src/lib/crafting.ts', code);

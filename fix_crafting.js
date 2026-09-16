import fs from 'fs';
let code = fs.readFileSync('src/lib/crafting.ts', 'utf8');

const newRecipes = `  {
    pattern: [
      null, BlockType.IronIngot, BlockType.IronIngot,
      null, BlockType.IronIngot, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.Gun,
    count: 1
  },
  {
    pattern: [
      null, BlockType.Wood, BlockType.Wire,
      BlockType.Wood, null, BlockType.Wire,
      null, BlockType.Wood, BlockType.Wire
    ],
    result: BlockType.Bow,
    count: 1
  },
  {
    pattern: [
      null, BlockType.IronIngot, null,
      null, BlockType.Wood, null,
      null, BlockType.Leaves, null
    ],
    result: BlockType.Arrow,
    count: 4
  },
  {
    pattern: [
      null, BlockType.IronIngot, null,
      null, BlockType.Coal, null,
      null, null, null
    ],
    result: BlockType.Bullet,
    count: 8
  },
  {
    pattern: [
      null, BlockType.IronIngot, null,
      BlockType.IronIngot, BlockType.Coal, BlockType.IronIngot,
      null, BlockType.IronIngot, null
    ],
    result: BlockType.Grenade,
    count: 2
  },
  {
    pattern: [
      BlockType.Coal, BlockType.Sand, BlockType.Coal,
      BlockType.Sand, BlockType.Coal, BlockType.Sand,
      BlockType.Coal, BlockType.Sand, BlockType.Coal
    ],
    result: BlockType.TNT,
    count: 1
  },
  {
    pattern: [
      null, null, null,
      BlockType.Coal, BlockType.Coal, BlockType.Coal,
      null, null, null
    ],
    result: BlockType.Wire,
    count: 4
  },
  {
    pattern: [
      null, null, null,
      BlockType.Stone, BlockType.Stone, null,
      null, null, null
    ],
    result: BlockType.PressurePlate,
    count: 1
  }
];`;

code = code.replace(/\];/, newRecipes);

fs.writeFileSync('src/lib/crafting.ts', code);

import { BlockType } from './constants';

export interface Recipe {
  pattern: (BlockType | null)[]; // 9 length array
  result: BlockType;
  count: number;
}

export const RECIPES: Recipe[] = [
  {
    pattern: [
      BlockType.Wood, null, null,
      null, null, null,
      null, null, null
    ],
    result: BlockType.Planks,
    count: 4
  },
  {
    pattern: [
      null, null, null,
      null, BlockType.Lava, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.Torch,
    count: 4
  },
  {
    pattern: [
      BlockType.Planks, BlockType.Planks, BlockType.Planks,
      null, BlockType.Wood, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.WoodPickaxe,
    count: 1
  },
  {
    pattern: [
      BlockType.Stone, BlockType.Stone, BlockType.Stone,
      null, BlockType.Wood, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.StonePickaxe,
    count: 1
  },
  {
    pattern: [
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot,
      null, BlockType.Planks, null,
      null, BlockType.Planks, null
    ],
    result: BlockType.IronPickaxe,
    count: 1
  },
  {
    pattern: [
      null, BlockType.IronIngot, null,
      null, BlockType.IronIngot, null,
      null, BlockType.Planks, null
    ],
    result: BlockType.IronSword,
    count: 1
  },
  {
    pattern: [
      BlockType.Stone, BlockType.Stone, BlockType.Stone,
      BlockType.Stone, null, BlockType.Stone,
      BlockType.Stone, BlockType.Stone, BlockType.Stone
    ],
    result: BlockType.Furnace,
    count: 1
  },
  {
    pattern: [
      BlockType.Planks, BlockType.Planks, BlockType.Planks,
      BlockType.Planks, null, BlockType.Planks,
      BlockType.Planks, BlockType.Planks, BlockType.Planks
    ],
    result: BlockType.Chest,
    count: 1
  },
  {
    pattern: [
      BlockType.Planks, BlockType.Planks, null,
      null, BlockType.Wood, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.WoodHoe,
    count: 1
  },
  {
    pattern: [
      BlockType.Stone, BlockType.Stone, null,
      null, BlockType.Wood, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.StoneHoe,
    count: 1
  },
  {
    pattern: [
      BlockType.IronIngot, BlockType.IronIngot, null,
      null, BlockType.Planks, null,
      null, BlockType.Planks, null
    ],
    result: BlockType.IronHoe,
    count: 1
  },
  {
    pattern: [
      BlockType.Planks, BlockType.Planks, null,
      BlockType.Planks, BlockType.Planks, null,
      BlockType.Planks, BlockType.Planks, null
    ],
    result: BlockType.Door,
    count: 1
  }
];

export function checkRecipe(grid: (BlockType | null)[]): { result: BlockType, count: number } | null {
  for (const recipe of RECIPES) {
    let match = true;
    for (let i = 0; i < 9; i++) {
      if (recipe.pattern[i] !== grid[i]) {
        match = false;
        break;
      }
    }
    if (match) return { result: recipe.result, count: recipe.count };
  }
  return null;
}

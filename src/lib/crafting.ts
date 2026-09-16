import { BlockType } from './constants';

export interface Recipe {
  pattern: (BlockType | null)[]; // 9 length array
  result: BlockType;
  count: number;
}

export const RECIPES: Recipe[] = [

  {
    pattern: [
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot,
      null, BlockType.Wire, null,
      null, BlockType.Wire, null
    ],
    result: BlockType.GrapplingHook,
    count: 1
  },
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
  },
  {
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
  },
  {
    pattern: [
      BlockType.BossDrop, null, null,
      null, BlockType.Wood, null,
      null, BlockType.Wood, null
    ],
    result: BlockType.MagicStaff,
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
// append to RECIPES list:

RECIPES.push(
  {
    pattern: [
      BlockType.GoldIngot, BlockType.GoldIngot, BlockType.GoldIngot,
      BlockType.GoldIngot, null, BlockType.GoldIngot,
      null, null, null
    ],
    result: BlockType.GoldHelmet,
    count: 1
  },
  {
    pattern: [
      null, null, null,
      BlockType.GoldIngot, BlockType.GoldIngot, BlockType.GoldIngot,
      BlockType.GoldIngot, null, BlockType.GoldIngot
    ],
    result: BlockType.GoldHelmet,
    count: 1
  },
  {
    pattern: [
      BlockType.GoldIngot, null, BlockType.GoldIngot,
      BlockType.GoldIngot, BlockType.GoldIngot, BlockType.GoldIngot,
      BlockType.GoldIngot, BlockType.GoldIngot, BlockType.GoldIngot
    ],
    result: BlockType.GoldChestplate,
    count: 1
  },
  {
    pattern: [
      BlockType.Diamond, BlockType.Diamond, BlockType.Diamond,
      BlockType.Diamond, null, BlockType.Diamond,
      null, null, null
    ],
    result: BlockType.DiamondHelmet,
    count: 1
  },
  {
    pattern: [
      null, null, null,
      BlockType.Diamond, BlockType.Diamond, BlockType.Diamond,
      BlockType.Diamond, null, BlockType.Diamond
    ],
    result: BlockType.DiamondHelmet,
    count: 1
  },
  {
    pattern: [
      BlockType.Diamond, null, BlockType.Diamond,
      BlockType.Diamond, BlockType.Diamond, BlockType.Diamond,
      BlockType.Diamond, BlockType.Diamond, BlockType.Diamond
    ],
    result: BlockType.DiamondChestplate,
    count: 1
  }
);

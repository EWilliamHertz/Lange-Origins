import fs from 'fs';
let code = fs.readFileSync('src/lib/crafting.ts', 'utf8');

const oldRecipe = `    result: BlockType.PressurePlate,
    count: 1
  }
];`;

const newRecipe = `    result: BlockType.PressurePlate,
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
];`;

code = code.replace(oldRecipe, newRecipe);
fs.writeFileSync('src/lib/crafting.ts', code);

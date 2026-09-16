const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Insert WizardStaff, BlueCrystal, Fireball
const newBlocks = `  Platform = 41,
  BlueCrystal = 42,
  
  // Tools & Weapons (100+)
  WoodPickaxe = 100,
  IronPickaxe = 101,
  Gun = 102,
  Bow = 103,
  WizardStaff = 104,`;

code = code.replace(
  /  Platform = 41,[\s\S]*?WoodPickaxe = 100,\n  IronPickaxe = 101,\n  Gun = 102,\n  Bow = 103,/,
  newBlocks
);

const newNames = `  [BlockType.Platform]: 'Platform',
  [BlockType.BlueCrystal]: 'Blue Crystal',
  [BlockType.WoodPickaxe]: 'Wooden Pickaxe',
  [BlockType.IronPickaxe]: 'Iron Pickaxe',
  [BlockType.Gun]: 'Gun',
  [BlockType.Bow]: 'Bow',
  [BlockType.WizardStaff]: 'Wizard Staff',`;

code = code.replace(
  /  \[BlockType.Platform\]: 'Platform',[\s\S]*?\[BlockType.WoodPickaxe\]: 'Wooden Pickaxe',\n  \[BlockType.IronPickaxe\]: 'Iron Pickaxe',\n  \[BlockType.Gun\]: 'Gun',\n  \[BlockType.Bow\]: 'Bow',/,
  newNames
);

const newRecipes = `  { result: BlockType.Bow, pattern: [0, BlockType.Wood, BlockType.Wire, BlockType.Wood, 0, BlockType.Wire, 0, BlockType.Wood, BlockType.Wire] },
  { result: BlockType.Platform, pattern: [BlockType.Wood, BlockType.Wood, BlockType.Wood, 0, 0, 0, 0, 0, 0] },
  { result: BlockType.WizardStaff, pattern: [BlockType.BlueCrystal, BlockType.BlueCrystal, BlockType.BlueCrystal, 0, BlockType.Wood, 0, 0, BlockType.Wood, 0] }
];`;

code = code.replace(
  /  \{ result: BlockType.Bow, pattern: \[0, BlockType.Wood, BlockType.Wire, BlockType.Wood, 0, BlockType.Wire, 0, BlockType.Wood, BlockType.Wire\] \},\n  \{ result: BlockType.Platform, pattern: \[BlockType.Wood, BlockType.Wood, BlockType.Wood, 0, 0, 0, 0, 0, 0\] \}\n\];/,
  newRecipes
);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Blocks patched.');

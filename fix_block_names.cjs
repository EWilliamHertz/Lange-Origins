const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  "  [BlockType.BlueCrystal]: '#2196F3',\n  [BlockType.TreeSeed]: '#4CAF50',",
  "  [BlockType.TreeSeed]: '#4CAF50',"
);

code = code.replace(
  "  [BlockType.BlueCrystal]: 10,\n  [BlockType.TreeSeed]: 0,",
  "  [BlockType.TreeSeed]: 0,"
);

code = code.replace(
  "[BlockType.MagicStaff]: 'Magic Staff'",
  `[BlockType.MagicStaff]: 'Magic Staff',
  [BlockType.DiamondSword]: 'Diamond Sword',
  [BlockType.GoldSword]: 'Gold Sword',
  [BlockType.StoneSword]: 'Stone Sword',
  [BlockType.GuideNPC]: 'Guide',
  [BlockType.GoblinNPC]: 'Goblin',
  [BlockType.WizardNPC]: 'Wizard',
  [BlockType.DurelNPC]: 'Durel',
  [BlockType.WizardStaff]: 'Wizard Staff',
  [BlockType.BlueCrystal]: 'Blue Crystal'`
);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Fixed BlockNames and duplicates');

const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  "MagicStaff = 406",
  `MagicStaff = 406,
  DiamondSword = 411,
  GoldSword = 412,
  StoneSword = 413,
  GuideNPC = 414,
  GoblinNPC = 415,
  WizardNPC = 416,
  DurelNPC = 417,
  WizardStaff = 418,
  BlueCrystal = 419`
);

code = code.replace(
  "[BlockType.MagicStaff]: '#9C27B0'",
  `[BlockType.MagicStaff]: '#9C27B0',
  [BlockType.DiamondSword]: '#00BCD4',
  [BlockType.GoldSword]: '#FFD700',
  [BlockType.StoneSword]: '#9E9E9E',
  [BlockType.GuideNPC]: '#FFC107',
  [BlockType.GoblinNPC]: '#4CAF50',
  [BlockType.WizardNPC]: '#9C27B0',
  [BlockType.DurelNPC]: '#F44336',
  [BlockType.WizardStaff]: '#673AB7',
  [BlockType.BlueCrystal]: '#2196F3',
  [BlockType.TreeSeed]: '#4CAF50'`
);

code = code.replace(
  "[BlockType.MagicStaff]: 0",
  `[BlockType.MagicStaff]: 0,
  [BlockType.DiamondSword]: 0,
  [BlockType.GoldSword]: 0,
  [BlockType.StoneSword]: 0,
  [BlockType.GuideNPC]: 0,
  [BlockType.GoblinNPC]: 0,
  [BlockType.WizardNPC]: 0,
  [BlockType.DurelNPC]: 0,
  [BlockType.WizardStaff]: 0,
  [BlockType.BlueCrystal]: 10,
  [BlockType.TreeSeed]: 0`
);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Fixed block types');

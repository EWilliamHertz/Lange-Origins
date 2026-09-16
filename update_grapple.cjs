const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

const newBlocks = `  WizardStaff = 104,
  GrapplingHook = 105,`;

code = code.replace("  WizardStaff = 104,", newBlocks);

const newNames = `  [BlockType.WizardStaff]: 'Wizard Staff',
  [BlockType.GrapplingHook]: 'Grappling Hook',`;

code = code.replace("  [BlockType.WizardStaff]: 'Wizard Staff',", newNames);

const newRecipes = `  { result: BlockType.WizardStaff, pattern: [BlockType.BlueCrystal, BlockType.BlueCrystal, BlockType.BlueCrystal, 0, BlockType.Wood, 0, 0, BlockType.Wood, 0] },
  { result: BlockType.GrapplingHook, pattern: [BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot, 0, BlockType.Wire, 0, 0, BlockType.Wire, 0] }`;

code = code.replace("{ result: BlockType.WizardStaff, pattern: [BlockType.BlueCrystal, BlockType.BlueCrystal, BlockType.BlueCrystal, 0, BlockType.Wood, 0, 0, BlockType.Wood, 0] }", newRecipes);

const newColors = `  [BlockType.MagicStaff]: '#9C27B0',
  [BlockType.GrapplingHook]: '#455A64'`;

code = code.replace("[BlockType.MagicStaff]: '#9C27B0'", newColors);

const newHardness = `  [BlockType.MagicStaff]: 0,
  [BlockType.GrapplingHook]: 0`;

code = code.replace("[BlockType.MagicStaff]: 0", newHardness);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Grapple constants added');

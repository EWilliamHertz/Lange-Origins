const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  /  \/\/ Tools & Weapons \(100\+\)\n  WoodPickaxe = 100,\n  IronPickaxe = 101,\n  Gun = 102,\n  Bow = 103,\n  WizardStaff = 104,/,
  "  // Tools & Weapons (100+)\n  WoodPickaxe = 100,\n  IronPickaxe = 101,\n  WizardStaff = 104,"
);
code = code.replace(
  /  \[BlockType.Gun\]: 'Gun',\n  \[BlockType.Bow\]: 'Bow',\n  \[BlockType.WizardStaff\]: 'Wizard Staff',/,
  "  [BlockType.WizardStaff]: 'Wizard Staff',"
);
fs.writeFileSync('src/lib/constants.ts', code);
console.log('Fixed constants');

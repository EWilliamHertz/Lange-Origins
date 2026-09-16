import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/WoodHoe = 106,/, "WoodHoe = 106,\n  Bow = 107,\n  Arrow = 108,");
code = code.replace(/\[BlockType\.WoodHoe\]: '#8D6E63',/, "[BlockType.WoodHoe]: '#8D6E63',\n  [BlockType.Bow]: '#5D4037',\n  [BlockType.Arrow]: '#FFFFFF',\n  [BlockType.Wire]: '#D50000',\n  [BlockType.PressurePlate]: '#616161',\n  [BlockType.DoorOpen]: '#4E342E',");

code = code.replace(/\[BlockType\.WoodHoe\]: 0,/, "[BlockType.WoodHoe]: 0,\n  [BlockType.Bow]: 0,\n  [BlockType.Arrow]: 0,\n  [BlockType.Wire]: 0,\n  [BlockType.PressurePlate]: 1,\n  [BlockType.DoorOpen]: 2,");

code = code.replace(/\[BlockType\.WoodHoe\]: 'Wooden Hoe',/, "[BlockType.WoodHoe]: 'Wooden Hoe',\n  [BlockType.Bow]: 'Bow',\n  [BlockType.Arrow]: 'Arrow',\n  [BlockType.Wire]: 'Redstone Wire',\n  [BlockType.PressurePlate]: 'Pressure Plate',\n  [BlockType.DoorOpen]: 'Open Door',");

fs.writeFileSync('src/lib/constants.ts', code);

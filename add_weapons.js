import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Add new BlockTypes
code = code.replace(/DoorOpen = 33,/, "DoorOpen = 33,\n  TNT = 34,");
code = code.replace(/Creeper = 301,/, "Creeper = 301,\n  Gun = 302,\n  Bullet = 303,\n  Grenade = 304,");

// Add colors
code = code.replace(/\[BlockType\.Creeper\]: '#4CAF50',/, "[BlockType.Creeper]: '#4CAF50',\n  [BlockType.TNT]: '#D32F2F',\n  [BlockType.Gun]: '#424242',\n  [BlockType.Bullet]: '#FFC107',\n  [BlockType.Grenade]: '#2E7D32',");

// Add hardness
code = code.replace(/\[BlockType\.Creeper\]: 0,/, "[BlockType.Creeper]: 0,\n  [BlockType.TNT]: 1,\n  [BlockType.Gun]: 0,\n  [BlockType.Bullet]: 0,\n  [BlockType.Grenade]: 0,");

// Add names
code = code.replace(/\[BlockType\.Creeper\]: 'Creeper',/, "[BlockType.Creeper]: 'Creeper',\n  [BlockType.TNT]: 'TNT',\n  [BlockType.Gun]: 'Gun',\n  [BlockType.Bullet]: 'Ammunition',\n  [BlockType.Grenade]: 'Hand Grenade',");

// Add SolidBlocks
code = code.replace(/BlockType\.Chest\]\);/, "BlockType.Chest, BlockType.TNT]);");

fs.writeFileSync('src/lib/constants.ts', code);

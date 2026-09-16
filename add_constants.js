import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Add to BlockType enum
code = code.replace(/Merchant = 30,/, `Merchant = 30,\n  Wire = 31,\n  PressurePlate = 32,\n  DoorOpen = 33,`);
code = code.replace(/Bow = 104,/, `Bow = 104,\n  Arrow = 105,`); // Wait, let's check if Bow exists.

fs.writeFileSync('src/lib/constants.ts', code);

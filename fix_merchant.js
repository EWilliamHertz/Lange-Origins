import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/\[BlockType\.Merchant\]: 'Wandering Merchant',/, "[BlockType.Merchant]: 'Merchant',");

fs.writeFileSync('src/lib/constants.ts', code);

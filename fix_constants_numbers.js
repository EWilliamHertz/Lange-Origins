import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/Bow = 107,\n  Arrow = 108,\n  Skeleton = 200,\n  Creeper = 201,/, "Bow = 109,\n  Arrow = 110,\n  Skeleton = 300,\n  Creeper = 301,");

fs.writeFileSync('src/lib/constants.ts', code);

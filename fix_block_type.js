import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// The first time it failed because it didn't find 'Apple = 121,'.
// Let's replace 'Apple = 202' with 'Apple = 202, Snow = 203, Ice = 204'
code = code.replace(/Apple = 202\n\}/, "Apple = 202,\n  Snow = 203,\n  Ice = 204\n}");

fs.writeFileSync('src/lib/constants.ts', code);

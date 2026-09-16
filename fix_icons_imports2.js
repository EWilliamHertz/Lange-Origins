import fs from 'fs';
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(/import \{ Bomb, LocateFixed, CircleDot,\n\s*Store,/, "import { Store,");

code = code.replace(/import \{/, "import { Bomb, LocateFixed, CircleDot,");

fs.writeFileSync('src/lib/icons.tsx', code);

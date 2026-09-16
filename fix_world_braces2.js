import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

code = code.replace(/    \}\n      \}\n    \}\n  \}\n\n  \/\/ Add some simple caves using simple random walk/, "    }\n  }\n\n  // Add some simple caves using simple random walk");

fs.writeFileSync('src/lib/world.ts', code);

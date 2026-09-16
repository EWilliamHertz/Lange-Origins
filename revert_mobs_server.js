import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const type = isNight \? \(Math\.random\(\) > 0\.5 \? 'prostitute' : 'rival_thug'\) : 'client';/, "const type = isNight ? 'zombie' : 'slime';");

fs.writeFileSync('server.ts', code);

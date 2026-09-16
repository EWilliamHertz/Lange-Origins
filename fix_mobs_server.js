import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const type = isNight \? 'zombie' : 'slime';/, 
`const typesNight = ['skeleton', 'creeper', 'zombie'];
        const type = isNight ? typesNight[Math.floor(Math.random() * typesNight.length)] : 'slime';`);

fs.writeFileSync('server.ts', code);

import fs from 'fs';
let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
lines.splice(552, 2); // Remove lines 553, 554 (index 552, 553)
fs.writeFileSync('server.ts', lines.join('\n'));

const fs = require('fs');
const lines = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8').split('\n');
console.log(lines.slice(7, 40).map((l, i) => `${7 + i}: ${l}`).join('\n'));

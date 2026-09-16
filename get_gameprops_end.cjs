const fs = require('fs');
const lines = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8').split('\n');
console.log(lines.slice(37, 50).map((l, i) => `${37 + i}: ${l}`).join('\n'));

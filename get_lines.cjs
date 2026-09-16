const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log(lines.slice(2350, 2370).map((l, i) => `${2350 + i}: ${l}`).join('\n'));

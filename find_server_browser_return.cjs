const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes("if (appState === 'serverBrowser') {") && l.includes("isAdmin"));
console.log(lines.slice(idx + 50, idx + 100).join('\n'));

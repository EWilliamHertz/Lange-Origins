const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "quests: JSON.stringify(latest.quests),",
  "quests: JSON.stringify(latest.quests),\n        kills: latest.kills,"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added kills to auto-save');

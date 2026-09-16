const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "setMana(prev => Math.min(100, prev + 2));",
  "setMana(prev => Math.min(100 + ((skills.strength || 0) * 20), prev + 2));"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed max mana regen');

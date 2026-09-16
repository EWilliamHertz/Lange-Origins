const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "{health} / (20 + (skills.vitality || 0) * 10)",
  "{health} / {20 + (skills.vitality || 0) * 10}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hud expression');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "width: `${(mana / 100) * 100}%`",
  "width: `${(mana / (100 + ((skills.strength || 0) * 20))) * 100}%`"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed mana bar width');

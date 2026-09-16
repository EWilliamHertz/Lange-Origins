const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "isInventoryOpen={inventoryOpen}",
  "isInventoryOpen={inventoryOpen}\n          mana={mana}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Passed mana to GameCanvas in App.tsx');

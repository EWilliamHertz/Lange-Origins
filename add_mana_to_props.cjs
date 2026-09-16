const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "skills={skills}",
  "skills={skills}\n          mana={mana}\n          onManaChange={setMana}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added mana to GameCanvas props');

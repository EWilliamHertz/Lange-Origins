const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "  isInventoryOpen: boolean;\n  onHealthChange: (h: number) => void;",
  "  isInventoryOpen: boolean;\n  onHealthChange: (h: number) => void;\n  mana?: number;"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('GameCanvas props patched.');

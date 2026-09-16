const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "  currentAmmoCount?: number;",
  "  currentAmmoCount?: number;\n  skills?: { vitality: number, speed: number, strength: number };\n  mana?: number;\n  onManaChange?: (mana: number) => void;\n  duelingOpponents?: string[];"
);

code = code.replace(
  "socketRef, onFireWeapon, currentAmmoCount, duelingOpponents }: GameProps)",
  "socketRef, onFireWeapon, currentAmmoCount, duelingOpponents, skills, mana, onManaChange }: GameProps)"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed GameProps');

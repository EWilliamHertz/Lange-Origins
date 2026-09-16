const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "if (intersectX && intersectY && (mob.type === 'rival_thug' || mob.type === 'slime' || mob.type === 'skeleton' || mob.type === 'creeper')) {",
  "if (intersectX && intersectY && ((mob.type === 'wolf' && !mob.ownerId) || mob.type === 'rival_thug' || mob.type === 'slime' || mob.type === 'skeleton' || mob.type === 'creeper')) {"
);

code = code.replace(
  "const baseDmg = (mob.type === 'golem_boss') ? 20 : (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : 3);",
  "const baseDmg = (mob.type === 'golem_boss') ? 20 : (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : (mob.type === 'wolf' ? 4 : 3));"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Wolf collision patched.');

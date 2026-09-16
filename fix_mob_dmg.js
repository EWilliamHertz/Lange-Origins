import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/if \(intersectX && intersectY && mob\.type === 'rival_thug'\) \{/, "if (intersectX && intersectY && (mob.type === 'rival_thug' || mob.type === 'slime' || mob.type === 'skeleton' || mob.type === 'creeper')) {");

fs.writeFileSync('src/components/GameCanvas.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Update player max health from 10 to 20
code = code.replace(/health: 10,\n      maxHealth: 10,/, 'health: 20,\n      maxHealth: 20,');

// Update damage values
const oldDmg = `const baseDmg = (mob.type === 'creeper') ? 30 : (mob.type === 'skeleton' ? 10 : 5);
                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;

const newDmg = `const baseDmg = (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : 3); // Creeper=7 hearts, Skeleton=2.5 hearts, Slime=1.5 hearts
                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;
                               
code = code.replace(oldDmg, newDmg);

fs.writeFileSync('src/components/GameCanvas.tsx', code);

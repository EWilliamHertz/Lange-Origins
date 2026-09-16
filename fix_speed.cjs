const fs = require('fs');
let code = fs.readFileSync('src/lib/physics.ts', 'utf8');

const targetSpeed = `const MAX_SPEED = 5;`;
const replaceSpeed = `const MAX_SPEED = 3.5;`;
code = code.replace(targetSpeed, replaceSpeed);

const targetBonus = `const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.5);`;
const replaceBonus = `const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.25);`; // Max speed is now 3.5 + 2.5 = 6
code = code.replace(targetBonus, replaceBonus);

fs.writeFileSync('src/lib/physics.ts', code);
console.log('Fixed speed');

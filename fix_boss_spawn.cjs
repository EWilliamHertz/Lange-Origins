const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "if (Object.keys(room.mobs).length < 6 && Math.random() < 0.05) {",
  "if (Object.keys(room.mobs).length < 15 && Math.random() < 0.20) {"
);

code = code.replace(
  "const isBossSpawn = Math.random() < 0.05;",
  "const isBossSpawn = Math.random() < 0.15;" // 15% instead of 5% for bosses
);

fs.writeFileSync('server.ts', code);
console.log('Increased boss spawn rates');

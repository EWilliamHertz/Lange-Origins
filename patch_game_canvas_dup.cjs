const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace("duelingOpponents, duelingOpponents,", "duelingOpponents,");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log("GameCanvas duplicate key patched.");

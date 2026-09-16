const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("Sounds.achievement?.();", "Sounds.click?.();");
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed audio call.");

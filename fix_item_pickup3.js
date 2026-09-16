import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ 2\. Try to stack in backpack\s*setBackpack\(prev => \{[\s\S]*?return prev;\s*\}\);/;
code = code.replace(regex, "");

fs.writeFileSync('src/App.tsx', code);

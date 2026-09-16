import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexBad = /      const hasHelmet = backpack.some\(s => s && s\.type === BlockType\.IronHelmet\) \|\| hotbar\.some\(s => s && s\.type === BlockType\.IronHelmet\);\n  const hasChestplate = backpack\.some\(s => s && s\.type === BlockType\.IronChestplate\) \|\| hotbar\.some\(s => s && s\.type === BlockType\.IronChestplate\);\n/g;

code = code.replace(regexBad, "");

fs.writeFileSync('src/App.tsx', code);

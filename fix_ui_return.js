import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const icon = getBlockIcon[\s\S]*?;\s*<div/m;
const replacement = `const icon = getBlockIcon(type, "w-full h-full p-1 drop-shadow-md");\n\n    return (\n      <div`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const countAmmo = \(type: number\) => \{/g,
"  const hasHelmet = backpack.some(s => s && s.type === BlockType.IronHelmet) || hotbar.some(s => s && s.type === BlockType.IronHelmet);\n" +
"  const hasChestplate = backpack.some(s => s && s.type === BlockType.IronChestplate) || hotbar.some(s => s && s.type === BlockType.IronChestplate);\n" +
"\n" +
"  const countAmmo = (type: number) => {"
);

fs.writeFileSync('src/App.tsx', code);

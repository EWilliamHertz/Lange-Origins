import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const hasHelmet = backpack\.some.*?;\n/g, '');
code = code.replace(/const hasChest = backpack\.some.*?;\n/g, '');
code = code.replace(/const hasChestplate = backpack\.some.*?;\n/g, '');

const repl = "  const hasHelmet = backpack.some(s => s && s.type === BlockType.IronHelmet) || hotbar.some(s => s && s.type === BlockType.IronHelmet);\n" +
"  const hasChestplate = backpack.some(s => s && s.type === BlockType.IronChestplate) || hotbar.some(s => s && s.type === BlockType.IronChestplate);\n\n" +
"  return (\n";

code = code.replace(/return \(\n/g, repl);

fs.writeFileSync('src/App.tsx', code);

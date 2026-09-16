import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badString = `      const hasHelmet = backpack.some(s => s && s.type === BlockType.IronHelmet) || hotbar.some(s => s && s.type === BlockType.IronHelmet);
  const hasChestplate = backpack.some(s => s && s.type === BlockType.IronChestplate) || hotbar.some(s => s && s.type === BlockType.IronChestplate);

  return (`;

code = code.split(badString).join("");
fs.writeFileSync('src/App.tsx', code);

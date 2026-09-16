import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hasArmor = `
  const hasHelmet = [...hotbar, ...backpack].some(slot => slot?.type === BlockType.IronHelmet);
  const hasChestplate = [...hotbar, ...backpack].some(slot => slot?.type === BlockType.IronChestplate);
`;

code = code.replace(/const currentAmmoCount = \[\.\.\.hotbar, \.\.\.backpack\]\.reduce\(\(acc, slot\) => acc \+ \(slot\?\.type === BlockType\.Bullet \? slot\.count : 0\), 0\);/, "const currentAmmoCount = [...hotbar, ...backpack].reduce((acc, slot) => acc + (slot?.type === BlockType.Bullet ? slot.count : 0), 0);\n" + hasArmor);

code = code.replace(/<GameCanvas\s*currentAmmoCount=\{currentAmmoCount\}/, "<GameCanvas\n          helmet={hasHelmet}\n          chestplate={hasChestplate}\n          currentAmmoCount={currentAmmoCount}");

fs.writeFileSync('src/App.tsx', code);

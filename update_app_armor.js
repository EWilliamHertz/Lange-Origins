import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const armorChecks = `
  const currentAmmoCount = 
      selectedBlock === 302 ? countAmmo(303) :
      selectedBlock === 109 ? countAmmo(110) :
      selectedBlock === 304 ? countAmmo(304) : 1;

  const hasHelmet = backpack.some(s => s && s.type === BlockType.IronHelmet) || hotbar.some(s => s && s.type === BlockType.IronHelmet);
  const hasChest = backpack.some(s => s && s.type === BlockType.IronChestplate) || hotbar.some(s => s && s.type === BlockType.IronChestplate);
`;
code = code.replace(/const currentAmmoCount = \n\s*selectedBlock === 302 \? countAmmo\(303\) :\n\s*selectedBlock === 109 \? countAmmo\(110\) :\n\s*selectedBlock === 304 \? countAmmo\(304\) : 1;/, armorChecks);

code = code.replace(/characterSkin=\{characterSkin\}/, "characterSkin={characterSkin}\n          helmet={hasHelmet}\n          chestplate={hasChest}");

fs.writeFileSync('src/App.tsx', code);

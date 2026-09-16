import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const armorChecksOld = `    const hasHelmet = backpack.some(s => s && s.type === BlockType.IronHelmet) || hotbar.some(s => s && s.type === BlockType.IronHelmet);
  const hasChestplate = backpack.some(s => s && s.type === BlockType.IronChestplate) || hotbar.some(s => s && s.type === BlockType.IronChestplate);`;

const armorChecksNew = `    const equippedHelmet = backpack.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type)) || 
                           hotbar.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type));
    const equippedChestplate = backpack.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type)) || 
                               hotbar.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type));
                               
    const helmetType = equippedHelmet ? equippedHelmet.type : null;
    const chestplateType = equippedChestplate ? equippedChestplate.type : null;`;

code = code.replace(armorChecksOld, armorChecksNew);

const canvasPropsOld = `        <GameCanvas
          helmet={hasHelmet}
          chestplate={hasChestplate}`;

const canvasPropsNew = `        <GameCanvas
          helmet={helmetType}
          chestplate={chestplateType}`;

code = code.replace(canvasPropsOld, canvasPropsNew);

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /let targetArray = type === 'hotbar' \? \[\.\.\.hotbar\] : type === 'backpack' \? \[\.\.\.backpack\] : \[\.\.\.craftingGrid\];\s+const \{ remainingTarget, remainingSource \} = tryMerge\(targetArray\[index\], cursorItem, isRightClick\);\s+targetArray\[index\] = remainingTarget;\s+setCursorItem\(remainingSource\);\s+if \(type === 'hotbar'\) setHotbar\(targetArray\);\s+else if \(type === 'backpack'\) setBackpack\(targetArray\);\s+else setCraftingGrid\(targetArray\);/g;

const replaceText = `
    if (type === 'equipment') {
      if (cursorItem) {
        if (index === 0 && cursorItem.type !== BlockType.IronHelmet && cursorItem.type !== BlockType.GoldHelmet && cursorItem.type !== BlockType.DiamondHelmet) {
          return; // invalid helmet
        }
        if (index === 1 && cursorItem.type !== BlockType.IronChestplate && cursorItem.type !== BlockType.GoldChestplate && cursorItem.type !== BlockType.DiamondChestplate) {
          return; // invalid chestplate
        }
      }
    }

    let targetArray = type === 'hotbar' ? [...hotbar] : type === 'backpack' ? [...backpack] : type === 'equipment' ? [...equipment] : [...craftingGrid];
    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);
    targetArray[index] = remainingTarget;
    setCursorItem(remainingSource);
    if (type === 'hotbar') setHotbar(targetArray);
    else if (type === 'backpack') setBackpack(targetArray);
    else if (type === 'equipment') setEquipment(targetArray);
    else setCraftingGrid(targetArray);
`;

code = code.replace(regex, replaceText);

fs.writeFileSync('src/App.tsx', code);
console.log("handleSlotClick patched.");

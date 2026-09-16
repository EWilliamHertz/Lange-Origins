const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const handleSlotClick = (type: 'hotbar' | 'backpack' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {",
  "const handleSlotClick = (type: 'hotbar' | 'backpack' | 'equipment' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {"
);

const targetText = `
    let targetArray = type === 'hotbar' ? [...hotbar] : type === 'backpack' ? [...backpack] : [...craftingGrid];
    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);
    targetArray[index] = remainingTarget;
    setCursorItem(remainingSource);
    if (type === 'hotbar') setHotbar(targetArray);
    else if (type === 'backpack') setBackpack(targetArray);
    else setCraftingGrid(targetArray);
`;

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

code = code.replace(targetText.trim(), replaceText.trim());

fs.writeFileSync('src/App.tsx', code);
console.log("handleSlotClick patched.");

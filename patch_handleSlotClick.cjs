const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const handleSlotClick = (type: 'hotbar' | 'backpack' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {",
  "const handleSlotClick = (type: 'hotbar' | 'backpack' | 'equipment' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {"
);

code = code.replace(
  "    let targetArray = type === 'hotbar' ? [...hotbar] : type === 'backpack' ? [...backpack] : [...craftingGrid];\n    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);\n    targetArray[index] = remainingTarget;\n    setCursorItem(remainingSource);\n\n    if (type === 'hotbar') setHotbar(targetArray);\n    else if (type === 'backpack') setBackpack(targetArray);\n    else setCraftingGrid(targetArray);",
  "    let targetArray = type === 'hotbar' ? [...hotbar] : type === 'backpack' ? [...backpack] : type === 'equipment' ? [...equipment] : [...craftingGrid];\n    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);\n    targetArray[index] = remainingTarget;\n    setCursorItem(remainingSource);\n\n    if (type === 'hotbar') setHotbar(targetArray);\n    else if (type === 'backpack') setBackpack(targetArray);\n    else if (type === 'equipment') setEquipment(targetArray);\n    else setCraftingGrid(targetArray);"
);

fs.writeFileSync('src/App.tsx', code);
console.log("handleSlotClick patched.");

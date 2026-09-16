const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetArrayReplace = `
    let targetArray = type === 'hotbar' ? [...hotbar] 
                    : type === 'backpack' ? [...backpack] 
                    : type === 'leftActionBar' ? [...leftActionBar]
                    : type === 'rightActionBar' ? [...rightActionBar]
                    : type === 'equipment' ? [...equipment] : [...craftingGrid];
    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);
    targetArray[index] = remainingTarget;
    setCursorItem(remainingSource);
    if (type === 'hotbar') setHotbar(targetArray);
    else if (type === 'leftActionBar') setLeftActionBar(targetArray);
    else if (type === 'rightActionBar') setRightActionBar(targetArray);
    else if (type === 'backpack') setBackpack(targetArray);
    else if (type === 'equipment') setEquipment(targetArray);
    else setCraftingGrid(targetArray);
`;

code = code.replace(/    let targetArray = type === 'hotbar' \? \[\.\.\.hotbar\] : type === 'backpack' \? \[\.\.\.backpack\] : type === 'equipment' \? \[\.\.\.equipment\] : \[\.\.\.craftingGrid\];[\s\S]*?else setCraftingGrid\(targetArray\);/, targetArrayReplace.trim());

fs.writeFileSync('src/App.tsx', code);
console.log('handleSlotClick patched for side action bars.');

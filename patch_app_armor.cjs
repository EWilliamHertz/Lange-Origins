const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'type InventorySlot = { type: BlockType; count: number } | null;',
  'type InventorySlot = { type: BlockType; count: number; durability?: number } | null;'
);

const handleArmorDamage = `
  const handleArmorDamage = () => {
    // Decrease durability of currently active armor
    const hType = getHelmet();
    const cType = getChestplate();
    
    let damaged = false;
    
    const applyDamageToArr = (arr) => {
      let updated = false;
      const newArr = arr.map(slot => {
         if (!slot) return null;
         if (slot.type === hType || slot.type === cType) {
            // Apply durability damage
            const maxDurability = slot.type === BlockType.DiamondHelmet || slot.type === BlockType.DiamondChestplate ? 150 :
                                  slot.type === BlockType.GoldHelmet || slot.type === BlockType.GoldChestplate ? 40 : 50;
            const currentDurability = slot.durability !== undefined ? slot.durability : maxDurability;
            
            if (currentDurability <= 1) {
               updated = true;
               damaged = true;
               return null; // Armor broke
            } else {
               updated = true;
               damaged = true;
               return { ...slot, durability: currentDurability - 1 };
            }
         }
         return slot;
      });
      return { arr: newArr, updated };
    };
    
    const { arr: newHotbar, updated: hUpdated } = applyDamageToArr(hotbar);
    if (hUpdated) setHotbar(newHotbar);
    
    if (!damaged) {
       const { arr: newBackpack, updated: bUpdated } = applyDamageToArr(backpack);
       if (bUpdated) setBackpack(newBackpack);
    }
  };
`;

code = code.replace('const helmetType = getHelmet();\n  const chestplateType = getChestplate();', handleArmorDamage + '\n  const helmetType = getHelmet();\n  const chestplateType = getChestplate();');

code = code.replace(
  '          chestplate={chestplateType}',
  '          chestplate={chestplateType}\n          onArmorDamage={handleArmorDamage}'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");

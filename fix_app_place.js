import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const placeCode = `
          onBlockPlaced={(blockType) => {
            Sounds.placeBlock();
            setHotbar(prev => {
               const newHotbar = [...prev];
               const slot = newHotbar[selectedSlotIndex];
               if (slot && slot.type === blockType) {
                   if (slot.count > 1) {
                       newHotbar[selectedSlotIndex] = { ...slot, count: slot.count - 1 };
                   } else {
                       newHotbar[selectedSlotIndex] = null;
                       // Change selected block if empty? We probably don't need to, but it will be handled by selectedBlock computation
                   }
               }
               return newHotbar;
            });
          }}
`;
code = code.replace(/onBlockPlaced=\{\(blockType\) => \{\n\s*Sounds\.placeBlock\(\);\n\s*\}\}/, placeCode);
fs.writeFileSync('src/App.tsx', code);

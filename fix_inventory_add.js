import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedMined = `
            const isEquipable = blockType >= 100;
            let remaining = 1;
            
            // 1. Try to stack in hotbar
            setHotbar(prev => {
               if (remaining === 0) return prev;
               const newHotbar = [...prev];
               if (!isEquipable) {
                 for (let i = 0; i < newHotbar.length; i++) {
                   if (newHotbar[i] && newHotbar[i]!.type === blockType && newHotbar[i]!.count < 64) {
                     newHotbar[i] = { ...newHotbar[i]!, count: newHotbar[i]!.count + 1 };
                     remaining = 0;
                     return newHotbar;
                   }
                 }
               }
               // Try empty hotbar slot
               const emptyIdx = newHotbar.indexOf(null);
               if (emptyIdx !== -1) {
                 newHotbar[emptyIdx] = { type: blockType, count: 1 };
                 remaining = 0;
                 return newHotbar;
               }
               return prev;
            });
            
            // 2. Try to stack in backpack
            setBackpack(prev => {
               if (remaining === 0) return prev;
               const newBp = [...prev];
               if (!isEquipable) {
                 for (let i = 0; i < newBp.length; i++) {
                   if (newBp[i] && newBp[i]!.type === blockType && newBp[i]!.count < 64) {
                     newBp[i] = { ...newBp[i]!, count: newBp[i]!.count + 1 };
                     remaining = 0;
                     return newBp;
                   }
                 }
               }
               // Try empty backpack slot
               const emptyIdx = newBp.indexOf(null);
               if (emptyIdx !== -1) {
                 newBp[emptyIdx] = { type: blockType, count: 1 };
                 remaining = 0;
                 return newBp;
               }
               return prev;
            });
`;

code = code.replace(/const isEquipable = blockType >= 100;[\s\S]*?return newBp;\n\s*\}\);\n\s*\}\}/, updatedMined + "\n          }}");
fs.writeFileSync('src/App.tsx', code);

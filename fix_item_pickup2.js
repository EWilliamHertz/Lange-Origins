import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
            const isEquipable = checkEquipable(blockType);
            
            // 1. Try to stack in hotbar
            setHotbar(prevHotbar => {
               const newHotbar = [...prevHotbar];
               let added = false;
               if (!isEquipable) {
                 for (let i = 0; i < newHotbar.length; i++) {
                   if (newHotbar[i] && newHotbar[i].type === blockType && newHotbar[i].count < 64) {
                     newHotbar[i] = { ...newHotbar[i], count: newHotbar[i].count + 1 };
                     added = true;
                     break;
                   }
                 }
               }
               if (!added) {
                 const emptyIdx = newHotbar.indexOf(null);
                 if (emptyIdx !== -1) {
                   newHotbar[emptyIdx] = { type: blockType, count: 1 };
                   added = true;
                 }
               }
               
               if (!added) {
                  // Fallback to backpack
                  setBackpack(prevBp => {
                     const newBp = [...prevBp];
                     let bpAdded = false;
                     if (!isEquipable) {
                       for (let i = 0; i < newBp.length; i++) {
                         if (newBp[i] && newBp[i].type === blockType && newBp[i].count < 64) {
                           newBp[i] = { ...newBp[i], count: newBp[i].count + 1 };
                           bpAdded = true;
                           break;
                         }
                       }
                     }
                     if (!bpAdded) {
                       const emptyIdx = newBp.indexOf(null);
                       if (emptyIdx !== -1) {
                         newBp[emptyIdx] = { type: blockType, count: 1 };
                         bpAdded = true;
                       }
                     }
                     return bpAdded ? newBp : prevBp;
                  });
               }
               
               return added ? newHotbar : prevHotbar;
            });
`;

code = code.replace(/const isEquipable = checkEquipable\(blockType\);\s*\/\/\ Collect item by using a unified inventory state approach[\s\S]*?addItem\(blockType\);/, replacement);

fs.writeFileSync('src/App.tsx', code);

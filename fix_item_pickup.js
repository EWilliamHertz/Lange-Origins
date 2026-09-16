import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
            const isEquipable = checkEquipable(blockType);
            
            // Collect item by using a unified inventory state approach
            const addItem = (blockType) => {
               setHotbar(currentHotbar => {
                  setBackpack(currentBackpack => {
                     let remaining = 1;
                     
                     // Helper to attempt adding to an inventory array
                     const tryAdd = (inv) => {
                        const newInv = [...inv];
                        if (!isEquipable) {
                           for (let i = 0; i < newInv.length; i++) {
                              if (newInv[i] && newInv[i].type === blockType && newInv[i].count < 64) {
                                 newInv[i] = { ...newInv[i], count: newInv[i].count + 1 };
                                 remaining = 0;
                                 return newInv;
                              }
                           }
                        }
                        const emptyIdx = newInv.indexOf(null);
                        if (emptyIdx !== -1) {
                           newInv[emptyIdx] = { type: blockType, count: 1 };
                           remaining = 0;
                           return newInv;
                        }
                        return newInv;
                     };
                     
                     const nextHotbar = tryAdd(currentHotbar);
                     if (remaining === 0) {
                         setHotbar(nextHotbar); // Actually update hotbar if we succeeded
                         return currentBackpack;
                     }
                     
                     const nextBackpack = tryAdd(currentBackpack);
                     if (remaining === 0) {
                         return nextBackpack;
                     }
                     
                     return currentBackpack;
                  });
                  return currentHotbar;
               });
            };
            
            addItem(blockType);
`;

code = code.replace(/const isEquipable = checkEquipable\(blockType\);\s*let remaining = 1;\s*\/\/\ 1\. Try to stack in hotbar[\s\S]*?return prev;\s*\}\);/, replacement);

fs.writeFileSync('src/App.tsx', code);

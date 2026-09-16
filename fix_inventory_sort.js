import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sortLogic = `
  const handleSortInventory = () => {
     // Combine hotbar and backpack
     const allItems: { type: number, count: number }[] = [];
     
     const processSlot = (slot: InventorySlot) => {
         if (!slot) return;
         const existing = allItems.find(i => i.type === slot.type);
         if (existing) {
             existing.count += slot.count;
         } else {
             allItems.push({ type: slot.type, count: slot.count });
         }
     };
     
     hotbar.forEach(processSlot);
     backpack.forEach(processSlot);
     
     // Sort by type (optional, but grouping is the main goal)
     allItems.sort((a, b) => a.type - b.type);
     
     // Re-distribute
     const newHotbar: InventorySlot[] = Array(10).fill(null);
     const newBackpack: InventorySlot[] = Array(27).fill(null);
     
     let itemIndex = 0;
     
     // Fill hotbar first (or we could just fill backpack and let them move things, but let's keep some in hotbar)
     // Actually, it's safer to fill hotbar then backpack, splitting stacks > 64
     
     const distributeStack = (type: number, count: number) => {
         let remaining = count;
         while (remaining > 0) {
             const chunk = Math.min(remaining, 64);
             remaining -= chunk;
             
             // Try hotbar
             let placed = false;
             for (let i = 0; i < 10; i++) {
                 if (newHotbar[i] === null) {
                     newHotbar[i] = { type, count: chunk };
                     placed = true;
                     break;
                 }
             }
             
             if (!placed) {
                 for (let i = 0; i < 27; i++) {
                     if (newBackpack[i] === null) {
                         newBackpack[i] = { type, count: chunk };
                         break;
                     }
                 }
             }
         }
     };
     
     allItems.forEach(item => distributeStack(item.type, item.count));
     
     setHotbar(newHotbar);
     setBackpack(newBackpack);
  };
`;
code = code.replace(/const handleSlotClick = /, sortLogic + "\n  const handleSlotClick = ");

const sortBtn = `
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold font-sans text-neutral-100 flex items-center gap-2">
                    <Box size={24} className="text-neutral-400" />
                    Backpack
                  </h2>
                  <button 
                    onClick={handleSortInventory}
                    className="bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 px-3 py-1.5 rounded flex items-center gap-2 border border-neutral-700 transition-colors"
                  >
                    <Layers size={14} /> Sort Items
                  </button>
                </div>
`;
code = code.replace(/<h2 className="text-xl font-bold font-sans text-neutral-100 flex items-center gap-2 mb-4">\s*<Box size=\{24\} className="text-neutral-400" \/>\s*Backpack\s*<\/h2>/, sortBtn);

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldGuide = `              {inventoryTab === 'guide' ? (
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                     <input 
                       type="text" 
                       placeholder="Search recipes..." 
                       value={recipeSearchQuery}
                       onChange={(e) => setRecipeSearchQuery(e.target.value)}
                       className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-500"
                     />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-[300px]">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredRecipes.map((recipe, index) => (
                       <div key={index} className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl flex items-center gap-6">
                         <div className="grid grid-cols-3 gap-1">
                           {recipe.pattern.map((bt, i) => (
                             <div key={i} className="w-8 h-8 p-1 bg-black/50 rounded flex items-center justify-center">
                               {renderBlockIcon(bt)}
                             </div>
                           ))}
                         </div>
                         <ArrowRight className="text-neutral-500 w-6 h-6" />
                         <div className="w-12 h-12 p-1.5 bg-black/50 rounded-lg border border-neutral-600 flex items-center justify-center">
                           {renderBlockIcon(recipe.result)}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
`;

const newGuide = `              {inventoryTab === 'guide' ? (
                <div className="flex flex-col min-h-0 flex-1">
                  <div className="mb-4 shrink-0">
                     <input 
                       type="text" 
                       placeholder="Search recipes..." 
                       value={recipeSearchQuery}
                       onChange={(e) => setRecipeSearchQuery(e.target.value)}
                       className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-500"
                     />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredRecipes.map((recipe, index) => {
                         // Check if we can craft this
                         const needed = {};
                         recipe.pattern.forEach(b => { if (b) needed[b] = (needed[b]||0) + 1; });
                         
                         // Count in backpack
                         const available = {};
                         backpack.forEach(s => { if (s) available[s.type] = (available[s.type]||0) + s.count; });
                         
                         let canCraft = true;
                         for (const t in needed) {
                             if ((available[t]||0) < needed[t]) {
                                 canCraft = false;
                                 break;
                             }
                         }

                         return (
                       <div key={index} className={"border p-4 rounded-xl flex items-center justify-between gap-4 " + (canCraft ? "bg-blue-900/20 border-blue-500/30" : "bg-neutral-900 border-neutral-700")}>
                         <div className="flex items-center gap-6">
                             <div className="grid grid-cols-3 gap-1">
                               {recipe.pattern.map((bt, i) => (
                                 <div key={i} className="w-8 h-8 p-1 bg-black/50 rounded flex items-center justify-center">
                                   {renderBlockIcon(bt)}
                                 </div>
                               ))}
                             </div>
                             <ArrowRight className="text-neutral-500 w-6 h-6" />
                             <div className="w-12 h-12 p-1.5 bg-black/50 rounded-lg border border-neutral-600 flex items-center justify-center">
                               {renderBlockIcon(recipe.result)}
                             </div>
                         </div>
                         
                         {canCraft && (
                            <button 
                                onClick={() => {
                                    // Auto-fill crafting grid
                                    const newBackpack = [...backpack];
                                    const newCraftingGrid = Array(9).fill(null);
                                    
                                    for (let i = 0; i < 9; i++) {
                                        const reqBlock = recipe.pattern[i];
                                        if (reqBlock) {
                                            // Find in backpack
                                            const bpIndex = newBackpack.findIndex(s => s && s.type === reqBlock && s.count > 0);
                                            if (bpIndex !== -1) {
                                                const s = newBackpack[bpIndex];
                                                newCraftingGrid[i] = { type: s.type, count: 1 };
                                                s.count--;
                                                if (s.count <= 0) newBackpack[bpIndex] = null;
                                            }
                                        }
                                    }
                                    
                                    // Move existing crafting items back to backpack first (not fully implemented for brevity, assume grid is empty or clear it)
                                    // To be safe, clear old grid to backpack first
                                    const returnToBackpack = (grid) => {
                                        grid.forEach(slot => {
                                            if (slot) {
                                                const existing = newBackpack.findIndex(s => s && s.type === slot.type && s.count < 64);
                                                if (existing !== -1) newBackpack[existing].count += slot.count;
                                                else {
                                                    const empty = newBackpack.findIndex(s => !s);
                                                    if (empty !== -1) newBackpack[empty] = slot;
                                                }
                                            }
                                        });
                                    };
                                    returnToBackpack(craftingGrid);
                                    setCraftingGrid(newCraftingGrid);
                                    setBackpack(newBackpack);
                                    setInventoryTab('crafting');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-colors shrink-0"
                            >
                                Auto-Fill
                            </button>
                         )}
                       </div>
                     )})}
                   </div>
                </div>
              </div>
            )}
`;

if (code.includes("{inventoryTab === 'guide' ? (")) {
  code = code.replace(/              \{inventoryTab === 'guide' \? \([\s\S]*?            \}\)/, newGuide.trim());
}

fs.writeFileSync('src/App.tsx', code);
console.log('Recipe book patched.');

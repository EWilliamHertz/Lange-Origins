import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sortBtn = `
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Inventory</h3>
                        <button 
                          onClick={handleSortInventory}
                          className="bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 px-3 py-1.5 rounded flex items-center gap-2 border border-neutral-700 transition-colors"
                        >
                          <Layers size={14} /> Sort Items
                        </button>
                      </div>
`;
code = code.replace(/<h3 className="text-white font-bold mb-3">Inventory<\/h3>/, sortBtn);
// Only replace the first one (in the standard inventory) to give the sort button. Or I can do it for all three (inventory, chest, furnace). The regex replace without /g only replaces the first match, which is perfect since it's the main inventory!

fs.writeFileSync('src/App.tsx', code);

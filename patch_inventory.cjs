const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const equipmentPanel = `
                  <div className="flex gap-8">
                    {/* Equipment Expand Button */}
                    <div className="flex flex-col gap-2 justify-center">
                       <button onClick={() => setShowEquipment(!showEquipment)} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-2 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Toggle Equipment">
                          <User size={20} />
                       </button>
                    </div>
                    {showEquipment && (
                      <div className="flex flex-col items-center gap-4 bg-neutral-900 p-4 rounded-lg border border-neutral-700 min-w-[140px]">
                         <h3 className="text-white font-bold w-full text-center">Equipment</h3>
                         <div className="flex flex-col gap-4 mt-2">
                           <div className="flex flex-col items-center gap-1 relative">
                             <span className="text-[10px] text-neutral-500 uppercase tracking-wider absolute -top-4">Helmet</span>
                             <button
                               onClick={() => handleSlotClick('equipment', 0)}
                               onContextMenu={(e) => { e.preventDefault(); handleSlotClick('equipment', 0, true); }}
                               className="w-14 h-14 p-1.5 bg-black/60 rounded-lg border border-neutral-700 hover:bg-white/10 transition-colors flex items-center justify-center shadow-inner"
                             >
                               {renderBlockIcon(equipment[0])}
                             </button>
                           </div>
                           <div className="flex flex-col items-center gap-1 relative mt-2">
                             <span className="text-[10px] text-neutral-500 uppercase tracking-wider absolute -top-4">Chestplate</span>
                             <button
                               onClick={() => handleSlotClick('equipment', 1)}
                               onContextMenu={(e) => { e.preventDefault(); handleSlotClick('equipment', 1, true); }}
                               className="w-14 h-14 p-1.5 bg-black/60 rounded-lg border border-neutral-700 hover:bg-white/10 transition-colors flex items-center justify-center shadow-inner"
                             >
                               {renderBlockIcon(equipment[1])}
                             </button>
                           </div>
                         </div>
                      </div>
                    )}
                    {/* Crafting Grid */}
`;

code = code.replace(
  '                  <div className="flex gap-8">\n                    {/* Crafting Grid */}',
  equipmentPanel
);

fs.writeFileSync('src/App.tsx', code);
console.log("Inventory patched.");

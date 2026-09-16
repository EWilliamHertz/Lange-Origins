const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\n        \{\/\* UI Overlay - Hotbar \*\/\}[\s\S]*?(?=\n        \{\/\* Inventory Modal Overlay \*\/)/;

const fixedHotbar = `
        {/* UI Overlay - Hotbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
          {hotbar.map((slot, index) => {
            const isSelected = selectedSlotIndex === index && !inventoryOpen;
            return (
              <button
                key={index}
                onClick={() => {
                  if (inventoryOpen) handleSlotClick('hotbar', index);
                  else setSelectedSlotIndex(index);
                }}
                onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('hotbar', index, true); }}
                className={\`w-12 h-12 p-1.5 rounded-lg relative transition-all duration-200 \${
                  isSelected 
                    ? 'ring-2 ring-white scale-110 bg-white/20 z-10' 
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'
                }\`}
              >
                <div className="absolute -top-1 -left-1 text-[9px] font-black bg-black/60 text-white w-4 h-4 flex items-center justify-center rounded border border-white/20 shadow-sm">{index + 1}</div>
                {renderBlockIcon(slot)}
              </button>
            );
          })}
        </div>`;

code = code.replace(regex, fixedHotbar);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hotbar with sed-like replace');

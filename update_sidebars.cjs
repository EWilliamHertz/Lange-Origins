const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexLeft = /          \{\/\* Left Action Bar Toggle \*\/\}[\s\S]*?          \}\)/;

code = code.replace(regexLeft, "");

const regexRight = /          \{\/\* Right Action Bar Slideout \*\/\}[\s\S]*?          \}\)\n          \}/;

code = code.replace(regexRight, "}");

const fixedSidebars = `        {/* Left Action Bar */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10">
           <div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+T<br/>Bind</div>
           {leftActionBar.map((slot, index) => (
             <button
               key={'l'+index}
               onClick={() => { if (inventoryOpen) handleSlotClick('leftActionBar', index); }}
               onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('leftActionBar', index, true); }}
               className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
             >
               {renderBlockIcon(slot)}
             </button>
           ))}
        </div>

        {/* Right Action Bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10">
           <div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+Y<br/>Bind</div>
           {rightActionBar.map((slot, index) => (
             <button
               key={'r'+index}
               onClick={() => { if (inventoryOpen) handleSlotClick('rightActionBar', index); }}
               onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('rightActionBar', index, true); }}
               className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
             >
               {renderBlockIcon(slot)}
             </button>
           ))}
        </div>`;

code = code.replace("{/* Health Bar */}", fixedSidebars + "\n\n        {/* Health Bar */}");

fs.writeFileSync('src/App.tsx', code);
console.log('Sidebars patched.');

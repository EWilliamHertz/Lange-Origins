const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sideBarsRender = `
        {/* UI Overlay - Hotbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
          {/* Left Action Bar Toggle */}
          <button 
             onClick={() => setShowLeftActionBar(!showLeftActionBar)}
             className="w-6 flex items-center justify-center bg-black/50 rounded hover:bg-white/20 text-white/50 hover:text-white"
          >
             {showLeftActionBar ? '<' : '>'}
          </button>
          
          {/* Left Action Bar Slideout */}
          {showLeftActionBar && (
             <div className="flex flex-col-reverse gap-1 mb-2 absolute bottom-full left-0 bg-black/40 p-2 rounded-xl border border-white/10">
                {leftActionBar.map((slot, index) => (
                  <button
                    key={'l'+index}
                    onClick={() => { if (inventoryOpen) handleSlotClick('leftActionBar', index); }}
                    onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('leftActionBar', index, true); }}
                    className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10"
                  >
                    {renderBlockIcon(slot)}
                  </button>
                ))}
             </div>
          )}
`;

code = code.replace(
  "{/* UI Overlay - Hotbar */}\n        <div className=\"absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl\">",
  sideBarsRender.trim()
);

const rightSideBarRender = `
          {/* Right Action Bar Slideout */}
          {showRightActionBar && (
             <div className="flex flex-col-reverse gap-1 mb-2 absolute bottom-full right-0 bg-black/40 p-2 rounded-xl border border-white/10">
                {rightActionBar.map((slot, index) => (
                  <button
                    key={'r'+index}
                    onClick={() => { if (inventoryOpen) handleSlotClick('rightActionBar', index); }}
                    onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('rightActionBar', index, true); }}
                    className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10"
                  >
                    {renderBlockIcon(slot)}
                  </button>
                ))}
             </div>
          )}
          
          {/* Right Action Bar Toggle */}
          <button 
             onClick={() => setShowRightActionBar(!showRightActionBar)}
             className="w-6 flex items-center justify-center bg-black/50 rounded hover:bg-white/20 text-white/50 hover:text-white ml-1"
          >
             {showRightActionBar ? '>' : '<'}
          </button>
        </div>
`;

code = code.replace(
  "            return (\n              <button",
  "            return (\n              <button" // this is inside map, wait
);

// We should find the end of the hotbar map
code = code.replace(
  "            return (\n              <button",
  "// temp1"
);

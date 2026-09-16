import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInstructions = `        {showInstructions && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-2xl max-w-md text-white">
              <h2 className="text-2xl font-bold mb-4">Instructions</h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300 mb-6">
                <li><strong>W, A, S, D</strong> or Arrows to Move & Jump</li>
                <li><strong>Click</strong> to Mine Blocks or Attack Mobs</li>
                <li><strong>Select Fists (Slot 1)</strong> to punch mobs without placing blocks</li>
                <li><strong>E</strong> to open Inventory & Crafting</li>
                <li><strong>1-9</strong> to select items in your hotbar (hotkeys shown in inventory)</li>
                <li><strong>Enter</strong> to Chat</li>
              </ul>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors"
              >
                Start Playing
              </button>
            </div>`;

code = code.replace(/        \{showInstructions && \([\s\S]*?<\/button>\n            <\/div>/, oldInstructions);
fs.writeFileSync('src/App.tsx', code);

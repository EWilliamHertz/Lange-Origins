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

const oldQuests = `  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Chop down 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tool', description: 'Craft a Wooden Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Capability', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Upgrades', description: 'Craft an Iron Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Efficiency', prerequisiteId: 'q3' },
  ]);`;

code = code.replace(/  const \[quests, setQuests\] = useState<Quest\[\]>\(\[\n    \{ id: 'q1'[\s\S]*?\n  \]\);/, oldQuests);

code = code.replace(/<h3 className="text-white font-bold text-xl mb-2 text-center">Drug Lab \/ Workbench<\/h3>/, '<h3 className="text-white font-bold text-xl mb-2 text-center">Furnace Smelting</h3>');
code = code.replace(/<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Input<\/span>/, '<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Ore</span>');
code = code.replace(/<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Catalyst \/ Fuel \(Scrap Metal\)<\/span>/, '<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Fuel (Coal)</span>');
code = code.replace(/PROCESS/g, 'SMELT');

fs.writeFileSync('src/App.tsx', code);

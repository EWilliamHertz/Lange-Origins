import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const gangsterInstructions = `        {showInstructions && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#111] p-8 rounded-2xl border border-red-900/30 shadow-2xl max-w-md text-white">
              <h2 className="text-3xl font-black mb-4 text-red-500 uppercase tracking-tighter">Welcome to the Streets</h2>
              <p className="text-neutral-400 text-sm mb-4">Build your empire. Complete quests. Hustle, survive, and dominate.</p>
              <ul className="list-none space-y-3 text-neutral-300 mb-8 bg-[#0a0a0a] p-4 rounded-xl border border-neutral-800">
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">W A S D</span> <span>Move & Jump</span></li>
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">CLICK</span> <span>Attack, Mine, or Hustle</span></li>
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">FISTS</span> <span>Select Slot 1 to throw hands</span></li>
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">E</span> <span>Inventory & Crafting (Stash)</span></li>
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">1-9</span> <span>Hotbar Weapons/Tools</span></li>
                <li className="flex gap-3"><span className="text-red-500 font-bold w-12 text-right">ENTER</span> <span>Talk to the streets</span></li>
              </ul>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider py-3 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                Enter the Underworld
              </button>
            </div>`;

code = code.replace(/        \{showInstructions && \([\s\S]*?<\/button>\n            <\/div>/, gangsterInstructions);

const newQuests = `  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Street Sweeper', description: 'Clear out 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Street Cred' },
    { id: 'q2', title: 'Scavenger', description: 'Scavenge 3 Steel Beams.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Weapon', description: 'Craft a Baseball Bat (Wooden Pickaxe).', goal: 1, current: 0, completed: false, rewardText: 'Self Defense', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Heavy Hitter', description: 'Craft a Glock 19 (Iron Pickaxe).', goal: 1, current: 0, completed: false, rewardText: 'Firepower', prerequisiteId: 'q3' },
  ]);`;

code = code.replace(/  const \[quests, setQuests\] = useState<Quest\[\]>\(\[\n    \{ id: 'q1'[\s\S]*?\n  \]\);/, newQuests);

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const maxHealthExpr = `(20 + (skills.vitality || 0) * 10)`;
const replacementHUD = `        {/* Player Status HUD */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 w-64 bg-black/50 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
           
           {/* Level & XP */}
           <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                   {level}
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-white uppercase tracking-wider">{nickname || 'Player'}</span>
                   <span className="text-[10px] text-amber-400 font-bold">{xp} / {level * 100} XP</span>
                </div>
             </div>
           </div>
           
           {/* XP Progress Bar */}
           <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden shadow-inner -mt-1">
              <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300" style={{ width: \`\${(xp / (level * 100)) * 100}%\` }}></div>
           </div>

           {/* Health Bar */}
           <div className="flex flex-col gap-1 mt-1">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] uppercase font-black text-red-400 tracking-wider flex items-center gap-1"><Heart size={10} className="fill-red-400" /> HP</span>
                <span className="text-[10px] font-bold text-neutral-300">{health} / ${maxHealthExpr}</span>
             </div>
             <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden shadow-inner border border-red-900/30">
                <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 relative" style={{ width: \`\${(health / ${maxHealthExpr}) * 100}%\` }}>
                   <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
             </div>
           </div>

           {/* Mana Bar */}
           {quests.find(q => q.id === 'q5')?.completed && (
             <div className="flex flex-col gap-1">
               <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider flex items-center gap-1">MP</span>
                  <span className="text-[10px] font-bold text-neutral-300">{mana} / {100 + (skills.strength || 0) * 20}</span>
               </div>
               <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden shadow-inner border border-blue-900/30">
                  <div className="h-full bg-gradient-to-r from-blue-700 to-cyan-400 transition-all duration-300 relative" style={{ width: \`\${(mana / (100 + (skills.strength || 0) * 20)) * 100}%\` }}>
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
               </div>
             </div>
           )}
        </div>`;

const startIdx = code.indexOf("{/* Health Bar */}");
const endIdx = code.indexOf("{/* Chat System */}");
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + replacementHUD + "\n        " + code.substring(endIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find boundaries.");
}

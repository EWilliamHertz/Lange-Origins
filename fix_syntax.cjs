const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const startIndex = 2250;
for (let i = startIndex; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && lines[i-1].trim() === '</div>' && lines[i-2].trim() === '</div>' && lines[i-3].trim() === '</div>') {
    lines[i] = `             ) : inventoryTab === 'skills' ? (
                <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                   <div className="bg-neutral-800/60 p-6 rounded-xl border border-neutral-700 flex flex-col gap-2">
                       <h3 className="text-2xl font-bold text-amber-400 drop-shadow">Experience</h3>
                       <div className="flex justify-between text-neutral-300 font-medium">
                           <span>Level {level}</span>
                           <span>{xp} / {level * 100} XP</span>
                       </div>
                       <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden mt-1 shadow-inner border border-neutral-700">
                           <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: \`\${Math.min(100, (xp / (level * 100)) * 100)}%\` }} />
                       </div>
                       <p className="text-neutral-400 text-sm mt-2">Available Skill Points: <span className="font-bold text-amber-300">{skillPoints}</span></p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="text-lg font-bold text-red-400 drop-shadow">Vitality</h4>
                                   <p className="text-neutral-400 text-sm">Increases Max Health (+10 per point)</p>
                               </div>
                               <span className="bg-neutral-900 px-3 py-1 rounded text-white font-bold border border-neutral-700">Lv {skills.vitality}</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, vitality: s.vitality + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-2 rounded flex items-center justify-center gap-2 mt-2 transition-colors"
                           >
                               <Plus size={18} /> Upgrade (1 SP)
                           </button>
                       </div>
                       
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="text-lg font-bold text-emerald-400 drop-shadow">Speed</h4>
                                   <p className="text-neutral-400 text-sm">Increases Movement Speed</p>
                               </div>
                               <span className="bg-neutral-900 px-3 py-1 rounded text-white font-bold border border-neutral-700">Lv {skills.speed} / 10</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0 && skills.speed < 10) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, speed: s.speed + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0 || skills.speed >= 10}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-2 rounded flex items-center justify-center gap-2 mt-2 transition-colors"
                           >
                               <Plus size={18} /> Upgrade (1 SP)
                           </button>
                       </div>
                       
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="text-lg font-bold text-blue-400 drop-shadow">Mana</h4>
                                   <p className="text-neutral-400 text-sm">Increases Max Mana (+20 per point)</p>
                               </div>
                               <span className="bg-neutral-900 px-3 py-1 rounded text-white font-bold border border-neutral-700">Lv {skills.strength || 0}</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, strength: (s.strength || 0) + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-2 rounded flex items-center justify-center gap-2 mt-2 transition-colors"
                           >
                               <Plus size={18} /> Upgrade (1 SP)
                           </button>
                       </div>
                   </div>
                </div>
             ) : null}`;
    fs.writeFileSync('src/App.tsx', lines.join('\n'));
    console.log('Fixed syntax and added skills UI at line ' + i);
    break;
  }
}


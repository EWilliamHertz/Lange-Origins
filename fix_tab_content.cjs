const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `              ) : inventoryTab === 'guide' ? (
                <div className="flex-1 w-full flex overflow-hidden max-h-[65vh]">
                  <div className="w-1/3 border-r border-neutral-700 overflow-y-auto p-4 pr-2 space-y-2 custom-scrollbar">
                    {RECIPES.map((recipe, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedRecipe(recipe)}
                        className={\`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors \${selectedRecipe === recipe ? 'bg-blue-900/40 border border-blue-500/50' : 'bg-neutral-800/50 hover:bg-neutral-700/50 border border-transparent'}\`}
                      >
                         <div className="w-8 h-8 flex-shrink-0">
                            {renderBlockIcon(recipe.result)}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-neutral-200 font-medium">{BlockNames[recipe.result]}</span>
                           <span className="text-neutral-500 text-xs">Yields: {recipe.count}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-2/3 p-6 flex flex-col items-center justify-center bg-black/20">
                     {selectedRecipe ? (
                       <div className="flex flex-col items-center max-w-sm w-full bg-neutral-800/80 p-6 rounded-xl border border-neutral-700 shadow-2xl">
                          <h3 className="text-2xl font-bold text-white mb-6 tracking-wide drop-shadow-md">{BlockNames[selectedRecipe.result]}</h3>
                          
                          <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="grid grid-cols-3 gap-1 bg-neutral-900/50 p-2 rounded-lg border border-neutral-700 shadow-inner">
                              {selectedRecipe.pattern.map((pt, i) => (
                                <div key={i} className="w-10 h-10 bg-black/40 border border-neutral-800 rounded-sm relative shadow-inner">
                                  {pt !== null && renderBlockIcon(pt)}
                                </div>
                              ))}
                            </div>
                            
                            <ArrowRight className="text-neutral-500 w-8 h-8" />
                            
                            <div className="w-16 h-16 bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                               {renderBlockIcon(selectedRecipe.result)}
                               {selectedRecipe.count > 1 && (
                                 <span className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-lg">x{selectedRecipe.count}</span>
                               )}
                            </div>
                          </div>
                          
                          <p className="text-neutral-400 text-sm text-center">
                            Arrange the items in your crafting grid exactly as shown above.
                          </p>
                       </div>
                     ) : (
                       <div className="text-neutral-500 flex flex-col items-center gap-3">
                         <Book size={48} className="opacity-20" />
                         <p>Select a recipe from the list to view its crafting pattern.</p>
                       </div>
                     )}
                  </div>
                </div>
              ) : inventoryTab === 'skills' ? (
                <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                   <div className="bg-neutral-800/60 p-6 rounded-xl border border-neutral-700 flex flex-col gap-2">
                       <h3 className="text-2xl font-bold text-amber-400 drop-shadow">Experience</h3>
                       <div className="flex justify-between text-neutral-300 font-medium">
                           <span>Level {level}</span>
                           <span>{xp} / {level * 100} XP</span>
                       </div>
                       <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden mt-1 shadow-inner border border-neutral-700">
                           <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: \`\${(xp / (level * 100)) * 100}%\` }} />
                       </div>
                       <p className="text-neutral-400 text-sm mt-2">Available Skill Points: <span className="font-bold text-amber-300">{skillPoints}</span></p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex items-center justify-between">
                           <div>
                               <h4 className="text-lg font-bold text-red-400 drop-shadow">Vitality</h4>
                               <p className="text-neutral-400 text-sm">Increases Max Health (+10 per point)</p>
                               <span className="text-white font-medium">Level {skills.vitality}</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, vitality: s.vitality + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold p-2 rounded"
                           >
                               <Plus size={20} />
                           </button>
                       </div>
                       
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex items-center justify-between">
                           <div>
                               <h4 className="text-lg font-bold text-emerald-400 drop-shadow">Speed</h4>
                               <p className="text-neutral-400 text-sm">Increases Movement Speed</p>
                               <span className="text-white font-medium">Level {skills.speed}</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0 && skills.speed < 10) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, speed: s.speed + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0 || skills.speed >= 10}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold p-2 rounded"
                           >
                               <Plus size={20} />
                           </button>
                       </div>
                       
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex items-center justify-between">
                           <div>
                               <h4 className="text-lg font-bold text-blue-400 drop-shadow">Mana</h4>
                               <p className="text-neutral-400 text-sm">Increases Max Mana (+20 per point)</p>
                               <span className="text-white font-medium">Level {skills.strength || 0}</span>
                           </div>
                           <button 
                               onClick={() => {
                                  if (skillPoints > 0) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, strength: (s.strength || 0) + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold p-2 rounded"
                           >
                               <Plus size={20} />
                           </button>
                       </div>
                   </div>
                </div>
              ) : null}`;

const idx1 = code.indexOf("inventoryTab === 'crafting' ? (");
const regex = /inventoryTab === 'crafting' \? \([\s\S]+?\) : \([\s\S]+?null\}/;
const match = code.match(regex);

if (match) {
  // we can just replace the whole `inventoryTab === 'crafting'` structure if we want.
  // Actually, I can just replace from `) : (` down to `null}`
}

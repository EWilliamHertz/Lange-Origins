import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# I will find where the stats section ends and add Abilities.
# Let's locate the Intelligence skill allocation button.
intel_block = """                           <button 
                               onClick={() => {
                                  if (skillPoints > 0) {
                                     setSkillPoints(sp => sp - 1);
                                     setSkills(s => ({ ...s, intelligence: (s.intelligence || 0) + 1 }));
                                  }
                               }}
                               disabled={skillPoints <= 0}
                               className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-2 rounded flex items-center justify-center gap-2 mt-2 transition-colors"
                           >
                               <Plus size={18} /> Allocate (1 SP)
                           </button>
                       </div>
                   </div>"""

abilities_block = intel_block + """
                   
                   <div className="bg-neutral-800/60 p-6 rounded-xl border border-neutral-700 flex flex-col gap-4">
                       <h3 className="text-2xl font-bold text-cyan-400 drop-shadow">Abilities</h3>
                       <p className="text-neutral-300 text-sm">Hover over an ability and press any key (e.g., Z, X, C, or 1-9) to bind it to that shortcut.</p>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                           {[{id: 'slash', name: 'Slash', desc: 'Melee attack.', req: 0, cost: 0, cd: 3, icon: <Sword size={24}/>}, 
                             {id: 'fireball', name: 'Fireball', desc: 'Shoot a flaming projectile.', req: 5, cost: 10, cd: 5, icon: <Flame size={24}/>},
                             {id: 'heal', name: 'Heal', desc: 'Restore 20 HP.', req: 3, cost: 20, cd: 10, icon: <Heart size={24}/>}].map(ability => {
                               const unlocked = (skills.intelligence || 0) >= ability.req;
                               // Find which key is bound to this ability
                               const boundKey = Object.entries(keybinds).find(([k, v]) => v === ability.id)?.[0];
                               return (
                                   <div 
                                      key={ability.id}
                                      onMouseEnter={() => { if (unlocked) hoveredSlotRef.current = { type: 'ability', index: ability.id as any }; }}
                                      onMouseLeave={() => { if (hoveredSlotRef.current?.type === 'ability') hoveredSlotRef.current = null; }}
                                      className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-colors relative ${unlocked ? 'bg-neutral-900 border-neutral-700 hover:border-cyan-500' : 'bg-neutral-900/50 border-neutral-800 opacity-60'}`}
                                   >
                                       <div className={`p-3 rounded-full ${unlocked ? 'bg-cyan-900/30 text-cyan-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                           {ability.icon}
                                       </div>
                                       <h5 className="font-bold text-white">{ability.name}</h5>
                                       {boundKey && <span className="absolute top-2 right-2 bg-amber-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded shadow-md">{boundKey.toUpperCase()}</span>}
                                       <p className="text-xs text-neutral-400">{ability.desc}</p>
                                       <div className="text-[10px] font-bold text-neutral-500 flex gap-2 mt-auto pt-2 border-t border-neutral-800 w-full justify-center">
                                           <span>Cost: {ability.cost} MP</span>
                                           <span>CD: {ability.cd}s</span>
                                       </div>
                                       {!unlocked && <p className="text-xs text-red-400 mt-1 font-bold">Requires Int {ability.req}</p>}
                                   </div>
                               );
                           })}
                       </div>
                   </div>
"""

content = content.replace(intel_block, abilities_block)
# Also add Sword and Flame icons
content = content.replace("Star, Globe, Clock, Shield, Sparkles,", "Star, Globe, Clock, Shield, Sparkles, Sword, Flame,")

with open('src/App.tsx', 'w') as f:
    f.write(content)

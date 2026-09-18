lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "<div>" in lines[i] and "Character Skin" in lines[i+1]:
        insert_code = """
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Class</label>
                  <div className="flex gap-2 mb-4">
                     {['warrior', 'mage', 'archer'].map(cls => (
                        <button
                           key={cls}
                           onClick={() => {
                             setPlayerClass(cls);
                             if (activeProfileId) {
                                setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, playerClass: cls } : p));
                             }
                           }}
                           className={`flex-1 py-2 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all ${playerClass === cls ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-black/50 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                        >
                           {cls}
                        </button>
                     ))}
                  </div>
                </div>
        """
        lines.insert(i, insert_code)
        break

for i in range(len(lines)):
    if "{p.name || 'Unnamed'} {p.health <= 0 && <span className=\"text-red-500 font-normal text-xs ml-2\">(Dead)</span>}" in lines[i]:
        lines[i] = lines[i] + " <span className=\"text-xs text-neutral-500 block font-normal capitalize\">Level {p.level || 1} {p.playerClass || 'Warrior'}</span>"

open('src/App.tsx', 'w').write('\n'.join(lines))

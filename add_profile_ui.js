import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const profileUI = `
            {/* Profile Selector */}
            <div className="bg-[#1A1A1E] rounded-2xl p-5 border border-white/5 mb-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <User size={14} /> Profile Management
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                 {profiles.map(p => (
                   <button
                     key={p.id}
                     onClick={() => {
                        setActiveProfileId(p.id);
                        setNickname(p.name || 'Player');
                        setCharacterSkin(p.skin || 'orange');
                        if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                        if (p.backpack) setBackpack(JSON.parse(p.backpack));
                        if (p.health !== undefined) setHealth(p.health);
                        if (p.quests) setQuests(JSON.parse(p.quests));
                     }}
                     className={\`px-4 py-2 rounded-xl text-sm font-bold border transition-all \${activeProfileId === p.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0A0A0B] border-white/5 text-neutral-400 hover:text-white'}\`}
                   >
                     {p.name || p.id}
                   </button>
                 ))}
                 <button
                   onClick={async () => {
                      if (!currentUser) return;
                      const newId = 'prof_' + Date.now();
                      const newName = 'Player' + Math.floor(Math.random() * 1000);
                      const newProfile = {
                         id: newId,
                         name: newName,
                         skin: 'orange',
                         health: 100,
                         hotbar: JSON.stringify(Array(10).fill(null)),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: serverTimestamp()
                      };
                      await setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), newProfile);
                      setProfiles([...profiles, { ...newProfile, updatedAt: Date.now() }]);
                      setActiveProfileId(newId);
                      setNickname(newName);
                      setCharacterSkin('orange');
                      setHotbar(Array(10).fill(null));
                      setBackpack(Array(27).fill(null));
                      setHealth(100);
                      setQuests([]);
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-800/40 transition-all flex items-center gap-1"
                 >
                   <Plus size={14} /> New Profile
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Display Name</label>
                  <input 
                    type="text" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                    placeholder="Enter Nickname..."
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Character Skin</label>
                  <div className="flex flex-wrap gap-2 pt-2">
                     {availableSkins.map(skin => (
                        <button 
                          key={skin.id}
                          onClick={() => setCharacterSkin(skin.id)}
                          className={\`w-10 h-10 rounded-full border-2 transition-all \${characterSkin === skin.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}\`}
                          style={{ backgroundColor: skin.color }}
                          title={skin.name}
                        />
                     ))}
                  </div>
                </div>
              </div>
            </div>
`;

code = code.replace(/<div className="relative w-full">\n\s*<label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Your Nickname<\/label>\n\s*<input\s*type="text"\s*value=\{nickname\}\n\s*onChange=\{\(e\) => setNickname\(e\.target\.value\)\}\n\s*className="w-full bg-\[\#0A0A0B\]\/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500\/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"\n\s*placeholder="Enter Nickname\.\.\."\n\s*\/>\n\s*<\/div>/, profileUI);

fs.writeFileSync('src/App.tsx', code);

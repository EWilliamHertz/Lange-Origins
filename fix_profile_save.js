import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInput = `                  <input 
                     type="text" 
                     value={nickname}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNickname(val);
                      if (activeProfileId) {
                         setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: val } : p));
                      }
                    }}
                    className="w-full bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                    placeholder="Enter Nickname..."
                    maxLength={16}
                  />`;

const newInput = `                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNickname(val);
                          if (activeProfileId) {
                             setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: val } : p));
                          }
                        }}
                        className="flex-1 bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                        placeholder="Enter Nickname..."
                        maxLength={16}
                     />
                     {activeProfileId && (
                         <button
                           onClick={saveProgress}
                           className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-2xl px-6 font-bold transition-all"
                         >
                           Save
                         </button>
                     )}
                  </div>`;

code = code.replace(oldInput, newInput);
fs.writeFileSync('src/App.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const deleteBtn = `
                 <button
                   onClick={async () => {
                      if (!currentUser || !activeProfileId) return;
                      if (profiles.length <= 1) {
                          alert("You cannot delete your only profile.");
                          return;
                      }
                      if (!window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) return;
                      
                      const newProfiles = profiles.filter(p => p.id !== activeProfileId);
                      setProfiles(newProfiles);
                      
                      const newActive = newProfiles[0];
                      setActiveProfileId(newActive.id);
                      setNickname(newActive.name || 'Player');
                      setCharacterSkin(newActive.skin || 'orange');
                      if (newActive.hotbar) setHotbar(JSON.parse(newActive.hotbar));
                      if (newActive.backpack) setBackpack(JSON.parse(newActive.backpack));
                      if (newActive.health !== undefined) setHealth(newActive.health);
                      if (newActive.quests) setQuests(JSON.parse(newActive.quests));
                      
                      import('firebase/firestore').then(({ deleteDoc, doc }) => {
                          deleteDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId));
                      });
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 bg-red-900/20 text-red-400 hover:bg-red-800/40 transition-all flex items-center gap-1"
                 >
                   <X size={14} /> Delete
                 </button>
`;

code = code.replace(/(<button\s*onClick=\{async \(\) => \{\s*if \(\!currentUser\) return;\s*const newId = 'prof_' \+ Date\.now\(\);[\s\S]*?New Profile\s*<\/button>)/, "$1\n" + deleteBtn);
fs.writeFileSync('src/App.tsx', code);

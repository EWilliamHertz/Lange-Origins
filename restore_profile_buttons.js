import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to replace the single Delete button with both the New Profile and Delete buttons
const deleteRegex = /<button[\s\S]*?<X size=\{14\} \/> Delete\s*<\/button>/;

const newButtons = `
                 <button
                   onClick={async () => {
                      if (!currentUser) return;
                      const newId = 'prof_' + Date.now();
                      const newName = nickname || 'New Profile';
                      const newSkin = characterSkin || 'orange';
                      
                      const defaultHotbar = [
                         { type: 103 /* BlockType.Fists */, count: 1 },
                         { type: 302 /* BlockType.Gun */, count: 1 },
                         { type: 109 /* BlockType.Bow */, count: 1 },
                         { type: 304 /* BlockType.Grenade */, count: 64 },
                         { type: 34 /* BlockType.TNT */, count: 64 },
                         { type: 31 /* BlockType.Wire */, count: 64 },
                         { type: 32 /* BlockType.PressurePlate */, count: 64 },
                         { type: 100 /* BlockType.WoodPickaxe */, count: 1 },
                         { type: 28 /* BlockType.Platform */, count: 64 },
                         null
                      ];
                      
                      const newProfile = {
                         id: newId,
                         name: newName,
                         skin: newSkin,
                         health: 100,
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: Date.now()
                      };
                      
                      import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                          setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), { ...newProfile, updatedAt: serverTimestamp() });
                      });
                      
                      setProfiles([...profiles, newProfile]);
                      setActiveProfileId(newId);
                      setNickname(newName);
                      setCharacterSkin(newSkin);
                      setHotbar(defaultHotbar);
                      setBackpack(Array(27).fill(null));
                      setHealth(100);
                      setQuests([]);
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-800/40 transition-all flex items-center gap-1"
                 >
                   <Plus size={14} /> New Profile
                 </button>

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

code = code.replace(deleteRegex, newButtons);
fs.writeFileSync('src/App.tsx', code);

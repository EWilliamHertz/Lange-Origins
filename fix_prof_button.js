import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
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
`;

code = code.replace(/onClick=\{async \(\) => \{\n\s*if \(\!currentUser\) return;\n\s*const newId = 'prof_' \+ Date\.now\(\);[\s\S]*?setQuests\(\[\]\);\n\s*\}\}/, replacement);
fs.writeFileSync('src/App.tsx', code);

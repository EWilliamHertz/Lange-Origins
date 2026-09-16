import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newProfileAction = `
                   const newId = 'profile_' + Date.now();
                   const newName = nickname || 'New Profile';
                   const newSkin = characterSkin || 'orange';
                   
                   const defaultHotbar = [
                      { type: BlockType.Fists, count: 1 },
                      { type: BlockType.Gun, count: 1 },
                      { type: BlockType.Bow, count: 1 },
                      { type: BlockType.Grenade, count: 64 },
                      { type: BlockType.TNT, count: 64 },
                      { type: BlockType.Wire, count: 64 },
                      { type: BlockType.PressurePlate, count: 64 },
                      { type: BlockType.WoodPickaxe, count: 1 },
                      { type: BlockType.Platform, count: 64 },
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
                      updatedAt: serverTimestamp()
                   };
                   await setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), newProfile);
                   setProfiles([...profiles, { ...newProfile, updatedAt: Date.now() }]);
                   setActiveProfileId(newId);
                   setNickname(newName);
                   setCharacterSkin(newSkin);
                   setHotbar(defaultHotbar);
                   setBackpack(Array(27).fill(null));
                   setHealth(100);
                   setQuests([]);
`;
code = code.replace(/const newId = 'profile_' \+ Date\.now\(\);[\s\S]*?setQuests\(\[\]\);/, newProfileAction);
fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// fetchBlueprints
code = code.replace(
  "      import('firebase/firestore').then(async ({ collection, getDocs, orderBy, query, limit }) => {",
  "      (async () => {\n         const { orderBy, query, limit } = require('firebase/firestore');"
);
code = code.replace(
  "        const q = query(collection(db, 'market_blueprints'), orderBy('createdAt', 'desc'), limit(20));\n        const snap = await getDocs(q);\n        setBlueprints(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));\n      });",
  "        const q = query(collection(db, 'market_blueprints'), orderBy('createdAt', 'desc'), limit(20));\n        const snap = await getDocs(q);\n        setBlueprints(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));\n      })();"
);

// handleCreateProfile
const handleCreateProfileTarget = `                      import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                         const newProfile = {
                            id: newId,
                            name: newProfileName || 'Player',
                            skin: newProfileSkin,
                            health: 100,
                            equipment: JSON.stringify([null, null]),
                            hotbar: JSON.stringify(defaultHotbar),
                            backpack: JSON.stringify(Array(27).fill(null)),
                            quests: JSON.stringify([]),
                            updatedAt: Date.now()
                         };
                         setDoc(doc(db, 'users', currentUser!.uid, 'profiles', newId), newProfile).then(() => {
                            setProfiles([...profiles, newProfile]);
                            setActiveProfileId(newId);
                            setNickname(newProfile.name);
                            setCharacterSkin(newProfile.skin);
                            setEquipment([null, null]);
                            setHotbar(defaultHotbar);
                            setBackpack(Array(27).fill(null));
                            setHealth(100);
                            setQuests([]);
                            setShowNewProfile(false);
                            setNewProfileName('');
                         });
                      });`;

const handleCreateProfileRepl = `
                         const newProfile = {
                            id: newId,
                            name: newProfileName || 'Player',
                            skin: newProfileSkin,
                            health: 100,
                            equipment: JSON.stringify([null, null]),
                            hotbar: JSON.stringify(defaultHotbar),
                            backpack: JSON.stringify(Array(27).fill(null)),
                            quests: JSON.stringify([]),
                            updatedAt: Date.now()
                         };
                         setDoc(doc(db, 'users', currentUser!.uid, 'profiles', newId), newProfile).then(() => {
                            setProfiles([...profiles, newProfile]);
                            setActiveProfileId(newId);
                            setNickname(newProfile.name);
                            setCharacterSkin(newProfile.skin);
                            setEquipment([null, null]);
                            setHotbar(defaultHotbar);
                            setBackpack(Array(27).fill(null));
                            setHealth(100);
                            setQuests([]);
                            setShowNewProfile(false);
                            setNewProfileName('');
                         });`;
code = code.replace(handleCreateProfileTarget, handleCreateProfileRepl);

// handleDeleteProfile
const handleDeleteProfileTarget = `                      import('firebase/firestore').then(({ deleteDoc, doc }) => {
                         deleteDoc(doc(db, 'users', currentUser!.uid, 'profiles', p.id)).then(() => {
                            setProfiles(profiles.filter(prof => prof.id !== p.id));
                         });
                      });`;

const handleDeleteProfileRepl = `
                         deleteDoc(doc(db, 'users', currentUser!.uid, 'profiles', p.id)).then(() => {
                            setProfiles(profiles.filter(prof => prof.id !== p.id));
                         });`;
code = code.replace(handleDeleteProfileTarget, handleDeleteProfileRepl);

fs.writeFileSync('src/App.tsx', code);
console.log("Firebase imports patched 2.");

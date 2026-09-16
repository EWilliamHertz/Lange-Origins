import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const loadCode = `
        // Load data from Firestore
        try {
          const profilesRef = collection(db, 'users', user.uid, 'profiles');
          const profilesSnap = await getDocs(profilesRef);
          const loadedProfiles = profilesSnap.docs.map(d => d.data());
          if (loadedProfiles.length > 0) {
              setProfiles(loadedProfiles);
              const active = loadedProfiles.sort((a,b) => b.updatedAt - a.updatedAt)[0];
              setActiveProfileId(active.id);
              setNickname(active.name || 'Player');
              setCharacterSkin(active.skin || 'orange');
              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));
              if (active.backpack) setBackpack(JSON.parse(active.backpack));
              if (active.quests) setQuests(JSON.parse(active.quests));
              if (active.health !== undefined) setHealth(active.health);
          } else {
             // Create initial profile
             const newId = 'prof_' + Date.now();
             const defaultHotbar = [
                         { type: 103, count: 1 },
                         { type: 302, count: 1 },
                         { type: 109, count: 1 },
                         { type: 304, count: 64 },
                         { type: 34, count: 64 },
                         { type: 31, count: 64 },
                         { type: 32, count: 64 },
                         { type: 100, count: 1 },
                         { type: 28, count: 64 },
                         null
             ];
             const newProfile = {
                         id: newId,
                         name: 'Player',
                         skin: 'orange',
                         health: 100,
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: Date.now()
             };
             await setDoc(doc(db, 'users', user.uid, 'profiles', newId), newProfile);
             setProfiles([newProfile]);
             setActiveProfileId(newId);
             setHotbar(defaultHotbar);
          }
        } catch (e) {
          console.error("Error loading progress", e);
        }
        setHasLoadedSave(true);
`;

code = code.replace(/\/\/\ Load data from Firestore[\s\S]*?setHasLoadedSave\(true\);/, loadCode);
fs.writeFileSync('src/App.tsx', code);

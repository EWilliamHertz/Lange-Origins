import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add new states
const profileStates = `
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
`;
code = code.replace(/const \[characterSkin, setCharacterSkin\] = useState<string>\('orange'\);/, "const [characterSkin, setCharacterSkin] = useState<string>('orange');\n" + profileStates);

// 2. Add collection to imports
code = code.replace(/import \{ doc, getDoc, setDoc, serverTimestamp \} from 'firebase\/firestore';/, "import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';");

// 3. Update the auth load logic
const newAuthLoad = `
        try {
          const profilesRef = collection(db, 'users', user.uid, 'profiles');
          const profilesSnap = await getDocs(profilesRef);
          const loadedProfiles = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setProfiles(loadedProfiles);
          
          if (loadedProfiles.length > 0) {
             const defaultProf = loadedProfiles[0];
             setActiveProfileId(defaultProf.id);
             setNickname(defaultProf.name);
             setCharacterSkin(defaultProf.skin);
             if (defaultProf.hotbar) setHotbar(JSON.parse(defaultProf.hotbar));
             if (defaultProf.backpack) setBackpack(JSON.parse(defaultProf.backpack));
             if (defaultProf.health !== undefined) setHealth(defaultProf.health);
             if (defaultProf.quests) setQuests(JSON.parse(defaultProf.quests));
          }
        } catch (e) {
          console.error('Error loading profiles:', e);
        }
        setHasLoadedSave(true);
`;
code = code.replace(/try \{\n\s*const docRef = doc\(db, 'users', user\.uid\);[\s\S]*?\} catch \(e\) \{\n\s*console\.error\('Error loading save:', e\);\n\s*\}\n\s*setHasLoadedSave\(true\);/, newAuthLoad);

// 4. Update save state ref
code = code.replace(/const saveStateRef = useRef\(\{ hotbar, backpack, quests, health, serverName, currentUser, appState \}\);/, "const saveStateRef = useRef({ hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });");
code = code.replace(/saveStateRef\.current = \{ hotbar, backpack, quests, health, serverName, currentUser, appState \};/, "saveStateRef.current = { hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin };");
code = code.replace(/\[hotbar, backpack, quests, health, serverName, currentUser, appState\]\);/, "[hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin]);");

// 5. Update saveProgress
const newSave = `
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId) return;
    try {
      const docRef = doc(db, 'users', latest.currentUser.uid, 'profiles', latest.activeProfileId);
      await setDoc(docRef, {
        name: latest.nickname,
        skin: latest.characterSkin,
        hotbar: JSON.stringify(latest.hotbar),
        backpack: JSON.stringify(latest.backpack),
        health: latest.health,
        quests: JSON.stringify(latest.quests),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
`;
code = code.replace(/const latest = saveStateRef\.current;\n\s*if \(\!latest\.currentUser\) return;\n\s*try \{\n\s*const docRef = doc\(db, 'users', latest\.currentUser\.uid\);\n\s*await setDoc\(docRef, \{[\s\S]*?updatedAt: serverTimestamp\(\)\n\s*\}, \{ merge: true \}\);\n\s*\} catch \(e\) \{/, newSave);


fs.writeFileSync('src/App.tsx', code);

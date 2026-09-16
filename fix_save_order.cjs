const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetSaveLogic = `  const saveStateRef = useRef({ equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills });
  useEffect(() => {
    saveStateRef.current = { equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills };
  }, [equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills]);

    const handleSignOut = async () => {
    try {
        await logout();
        setAppState('landing');
        setCurrentUser(null);
    } catch (e) {
        console.error(e);
    }
  };

  const saveProgress = async () => {
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId) return;
    try {
      const docRef = doc(db, 'users', latest.currentUser.uid, 'profiles', latest.activeProfileId);
      await setDoc(docRef, {
        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        leftActionBar: JSON.stringify(latest.leftActionBar),
        rightActionBar: JSON.stringify(latest.rightActionBar),
        backpack: JSON.stringify(latest.backpack),
        health: latest.health,
        quests: JSON.stringify(latest.quests),
        kills: latest.kills,
        xp: latest.xp,
        level: latest.level,
        skillPoints: latest.skillPoints,
        skills: JSON.stringify(latest.skills),
        name: latest.nickname,
        skin: latest.characterSkin,
        lastRoom: latest.serverName || 'public-lobby',
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("Progress auto-saved.");
    } catch (e) {
      console.error("Failed to auto-save progress", e);
    }
  };

  useEffect(() => {
    if (!currentUser || !hasLoadedSave || appState !== 'playing') return;
    const timeout = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timeout);
  }, [currentUser, hasLoadedSave, appState, equipment, hotbar, backpack, quests, health]);`;

code = code.replace(targetSaveLogic, `    const handleSignOut = async () => {
    try {
        await logout();
        setAppState('landing');
        setCurrentUser(null);
    } catch (e) {
        console.error(e);
    }
  };`);

const targetInsertPoint = `  const [showRightActionBar, setShowRightActionBar] = useState(false);`;
const insertLogic = `  const [showRightActionBar, setShowRightActionBar] = useState(false);

  const saveStateRef = useRef({ equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills });
  useEffect(() => {
    saveStateRef.current = { equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills };
  }, [equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills]);

  const saveProgress = async () => {
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId) return;
    try {
      const docRef = doc(db, 'users', latest.currentUser.uid, 'profiles', latest.activeProfileId);
      await setDoc(docRef, {
        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        leftActionBar: JSON.stringify(latest.leftActionBar),
        rightActionBar: JSON.stringify(latest.rightActionBar),
        backpack: JSON.stringify(latest.backpack),
        health: latest.health,
        quests: JSON.stringify(latest.quests),
        kills: latest.kills,
        xp: latest.xp,
        level: latest.level,
        skillPoints: latest.skillPoints,
        skills: JSON.stringify(latest.skills),
        name: latest.nickname,
        skin: latest.characterSkin,
        lastRoom: latest.serverName || 'public-lobby',
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("Progress auto-saved.");
    } catch (e) {
      console.error("Failed to auto-save progress", e);
    }
  };

  useEffect(() => {
    if (!currentUser || !hasLoadedSave || appState !== 'playing') return;
    const timeout = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timeout);
  }, [currentUser, hasLoadedSave, appState, equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health]);`;

code = code.replace(targetInsertPoint, insertLogic);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed initialization order for leftActionBar and rightActionBar');

const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

const correctSaveLogic = `
  const saveProgress = async () => {
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId) return;
    try {
      const docRef = doc(db, 'users', latest.currentUser.uid, 'profiles', latest.activeProfileId);
      await setDoc(docRef, {
        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        backpack: JSON.stringify(latest.backpack),
        health: latest.health,
        quests: JSON.stringify(latest.quests),
        name: latest.nickname,
        skin: latest.characterSkin,
        lastRoom: latest.serverName || 'public-lobby',
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("Progress auto-saved.");
`;

appTsx = appTsx.replace(
  /  const saveProgress = async \(\) => \{[\s\S]*?console\.log\("Progress auto-saved\."\);/,
  correctSaveLogic
);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Auto-save fixed.");

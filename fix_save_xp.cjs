const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const saveStateRef = useRef\(\{ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills \}\);/g,
  "const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills });"
);

code = code.replace(
  /saveStateRef.current = \{ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills \};/g,
  "saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills };"
);

code = code.replace(
  /\}, \[equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills\]\);/g,
  "}, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills]);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added xp to saveStateRef');

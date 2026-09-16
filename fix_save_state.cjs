const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });",
  "const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills });"
);

code = code.replace(
  "saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin };",
  "saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills };"
);

code = code.replace(
  "}, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin]);",
  "}, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills]);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added kills to saveStateRef');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update saveStateRef
const targetRef = `const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills });`;
const replaceRef = `const saveStateRef = useRef({ equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills });`;
code = code.replace(targetRef, replaceRef);

const targetRefUseEffect = `  useEffect(() => {
    saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills };
  }, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills]);`;
const replaceRefUseEffect = `  useEffect(() => {
    saveStateRef.current = { equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills };
  }, [equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, skillPoints, skills]);`;
code = code.replace(targetRefUseEffect, replaceRefUseEffect);

// 2. Update saveProgress
const targetSaveDoc = `        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        backpack: JSON.stringify(latest.backpack),`;
const replaceSaveDoc = `        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        leftActionBar: JSON.stringify(latest.leftActionBar),
        rightActionBar: JSON.stringify(latest.rightActionBar),
        backpack: JSON.stringify(latest.backpack),`;
code = code.replace(targetSaveDoc, replaceSaveDoc);

// 3. Update loading in handleProfileLoad (first load)
const targetLoadProfile = `              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));
              if (active.backpack) setBackpack(JSON.parse(active.backpack));`;
const replaceLoadProfile = `              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));
              if (active.leftActionBar) setLeftActionBar(JSON.parse(active.leftActionBar));
              if (active.rightActionBar) setRightActionBar(JSON.parse(active.rightActionBar));
              if (active.backpack) setBackpack(JSON.parse(active.backpack));`;
code = code.replace(targetLoadProfile, replaceLoadProfile);

// Update load logic when selecting a profile
const targetLoadSelect = `                          if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                          if (p.backpack) setBackpack(JSON.parse(p.backpack));`;
const replaceLoadSelect = `                          if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                          if (p.leftActionBar) setLeftActionBar(JSON.parse(p.leftActionBar));
                          if (p.rightActionBar) setRightActionBar(JSON.parse(p.rightActionBar));
                          if (p.backpack) setBackpack(JSON.parse(p.backpack));`;
code = code.replace(targetLoadSelect, replaceLoadSelect);

// Delete profile active switch
const targetLoadDelete = `                      if (newActive.hotbar) setHotbar(JSON.parse(newActive.hotbar));
                      if (newActive.backpack) setBackpack(JSON.parse(newActive.backpack));`;
const replaceLoadDelete = `                      if (newActive.hotbar) setHotbar(JSON.parse(newActive.hotbar));
                      if (newActive.leftActionBar) setLeftActionBar(JSON.parse(newActive.leftActionBar));
                      if (newActive.rightActionBar) setRightActionBar(JSON.parse(newActive.rightActionBar));
                      if (newActive.backpack) setBackpack(JSON.parse(newActive.backpack));`;
code = code.replace(targetLoadDelete, replaceLoadDelete);

// New profile
const targetLoadNew = `                      setHotbar(defaultHotbar);
                      setBackpack(Array(27).fill(null));`;
const replaceLoadNew = `                      setHotbar(defaultHotbar);
                      setLeftActionBar(Array(10).fill(null));
                      setRightActionBar(Array(10).fill(null));
                      setBackpack(Array(27).fill(null));`;
code = code.replace(targetLoadNew, replaceLoadNew);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed side hotbars save/load');

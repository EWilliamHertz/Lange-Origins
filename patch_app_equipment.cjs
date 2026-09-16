const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add equipment state
code = code.replace(
  '  const [hotbar, setHotbar] = useState<InventorySlot[]>([',
  '  const [equipment, setEquipment] = useState<InventorySlot[]>([null, null]); // [helmet, chestplate]\n  const [hotbar, setHotbar] = useState<InventorySlot[]>(['
);

// 2. Add equipment to saveStateRef
code = code.replace(
  'const saveStateRef = useRef({ hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });',
  'const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });'
);
code = code.replace(
  '    saveStateRef.current = { hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin };',
  '    saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin };'
);
code = code.replace(
  '  }, [hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin]);',
  '  }, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin]);'
);

// 3. Update saveProgress
code = code.replace(
  '        hotbar: JSON.stringify(latest.hotbar),',
  '        equipment: JSON.stringify(latest.equipment),\n        hotbar: JSON.stringify(latest.hotbar),'
);

code = code.replace(
  '  }, [currentUser, hasLoadedSave, appState, hotbar, backpack, quests, health]);',
  '  }, [currentUser, hasLoadedSave, appState, equipment, hotbar, backpack, quests, health]);'
);

// 4. Update load progress
code = code.replace(
  '              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));',
  '              if (active.equipment) setEquipment(JSON.parse(active.equipment));\n              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));'
);

code = code.replace(
  "                         hotbar: JSON.stringify(defaultHotbar),",
  "                         equipment: JSON.stringify([null, null]),\n                         hotbar: JSON.stringify(defaultHotbar),"
);
code = code.replace(
  "             setHotbar(defaultHotbar);",
  "             setEquipment([null, null]);\n             setHotbar(defaultHotbar);"
);

// Replace getHelmet / getChestplate to use equipment
const getEquipmentRepl = `
  const getHelmet = () => equipment[0] ? equipment[0].type : null;
  const getChestplate = () => equipment[1] ? equipment[1].type : null;
`;

code = code.replace(
  '  const getHelmet = () => {\n    const items = [...hotbar, ...backpack];\n    if (items.some(s => s?.type === BlockType.DiamondHelmet)) return BlockType.DiamondHelmet;\n    if (items.some(s => s?.type === BlockType.GoldHelmet)) return BlockType.GoldHelmet;\n    if (items.some(s => s?.type === BlockType.IronHelmet)) return BlockType.IronHelmet;\n    return null;\n  };\n\n  const getChestplate = () => {\n    const items = [...hotbar, ...backpack];\n    if (items.some(s => s?.type === BlockType.DiamondChestplate)) return BlockType.DiamondChestplate;\n    if (items.some(s => s?.type === BlockType.GoldChestplate)) return BlockType.GoldChestplate;\n    if (items.some(s => s?.type === BlockType.IronChestplate)) return BlockType.IronChestplate;\n    return null;\n  };',
  getEquipmentRepl
);

code = code.replace(
  '    const { arr: newHotbar, updated: hUpdated } = applyDamageToArr(hotbar);\n    if (hUpdated) setHotbar(newHotbar);\n    \n    if (!damaged) {\n       const { arr: newBackpack, updated: bUpdated } = applyDamageToArr(backpack);\n       if (bUpdated) setBackpack(newBackpack);\n    }',
  '    const { arr: newEquipment, updated: eUpdated } = applyDamageToArr(equipment);\n    if (eUpdated) setEquipment(newEquipment);'
);

fs.writeFileSync('src/App.tsx', code);
console.log("State patched.");

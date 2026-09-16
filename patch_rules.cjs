const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace("data.keys().hasAll(['health', 'hotbar', 'backpack', 'quests', 'lastRoom', 'updatedAt'])", "data.keys().hasAll(['health', 'hotbar', 'backpack', 'equipment', 'quests', 'lastRoom', 'updatedAt'])");
code = code.replace("data.keys().size() == 6", "data.keys().size() == 7");
code = code.replace("&& data.hotbar is string", "&& data.equipment is string && data.equipment.size() <= 5000\n        && data.hotbar is string");

code = code.replace("data.keys().hasAll(['name', 'skin', 'health', 'hotbar', 'backpack', 'quests', 'updatedAt'])", "data.keys().hasAll(['name', 'skin', 'health', 'hotbar', 'backpack', 'equipment', 'quests', 'updatedAt'])");

fs.writeFileSync('firestore.rules', code);
console.log("Rules patched.");

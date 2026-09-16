const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace("&& data.health <= 100\n        && data.hotbar is string\n        && data.hotbar.size() <= 10000\n        && data.backpack is string", "&& data.health <= 100\n        && data.equipment is string && data.equipment.size() <= 5000\n        && data.hotbar is string\n        && data.hotbar.size() <= 10000\n        && data.backpack is string");

fs.writeFileSync('firestore.rules', code);
console.log("Rules patched.");

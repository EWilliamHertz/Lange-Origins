const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace("QuestNPC = 200,", "QuestNPC = 200,\n  DurelNPC = 202,");
code = code.replace("[BlockType.QuestNPC]: 'Quest NPC',", "[BlockType.QuestNPC]: 'Quest NPC',\n  [BlockType.DurelNPC]: 'DUREL',");
code = code.replace("  [BlockType.QuestNPC]: '#9C27B0',", "  [BlockType.QuestNPC]: '#9C27B0',\n  [BlockType.DurelNPC]: '#E91E63',");

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Added DurelNPC');

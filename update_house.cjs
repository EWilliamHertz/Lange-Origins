const fs = require('fs');
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

code = code.replace(
  "  world[centerX][centerY - 1] = BlockType.QuestNPC;",
  "  world[centerX][centerY - 1] = BlockType.QuestNPC;\n  world[centerX + 3][centerY - 1] = BlockType.DurelNPC;"
);

fs.writeFileSync('src/lib/world.ts', code);
console.log('Spawned Durel in world');

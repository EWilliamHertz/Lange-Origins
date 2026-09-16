const fs = require('fs');

let constants = fs.readFileSync('src/lib/constants.ts', 'utf8');
constants = constants.replace("  Merchant = 12,", "  Merchant = 12,\n  GuideNPC = 13,\n  GoblinNPC = 14,\n  WizardNPC = 15,");
constants = constants.replace("  [BlockType.QuestNPC]: 'Quest NPC',", "  [BlockType.QuestNPC]: 'Quest NPC',\n  [BlockType.GuideNPC]: 'Guide',\n  [BlockType.GoblinNPC]: 'Goblin Tinkerer',\n  [BlockType.WizardNPC]: 'Wizard',");
constants = constants.replace("  [BlockType.QuestNPC]: '#FFC107',", "  [BlockType.QuestNPC]: '#FFC107',\n  [BlockType.GuideNPC]: '#8BC34A',\n  [BlockType.GoblinNPC]: '#607D8B',\n  [BlockType.WizardNPC]: '#9C27B0',");
fs.writeFileSync('src/lib/constants.ts', constants);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("if (blockType === BlockType.QuestNPC) {", "if (blockType === BlockType.QuestNPC || blockType === BlockType.GuideNPC || blockType === BlockType.GoblinNPC || blockType === BlockType.WizardNPC) {");
fs.writeFileSync('src/App.tsx', app);

let canvas = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
canvas = canvas.replace("if (block === BlockType.QuestNPC) {", "if (block === BlockType.QuestNPC || block === BlockType.GuideNPC || block === BlockType.GoblinNPC || block === BlockType.WizardNPC) {\n                 let shirtColor = '#E91E63';\n                 let skinColor = '#F8BBD0';\n                 if (block === BlockType.GuideNPC) { shirtColor = '#4CAF50'; skinColor = '#FFE0B2'; }\n                 else if (block === BlockType.GoblinNPC) { shirtColor = '#37474F'; skinColor = '#A5D6A7'; }\n                 else if (block === BlockType.WizardNPC) { shirtColor = '#673AB7'; skinColor = '#E1BEE7'; }\n                 ctx.fillStyle = skinColor; // skin\n                 ctx.beginPath();\n                 ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/3, TILE_SIZE/4, 0, Math.PI * 2);\n                 ctx.fill();\n                 ctx.fillStyle = shirtColor; // shirt\n                 ctx.fillRect(x * TILE_SIZE + TILE_SIZE/4, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);\n               } else if (false) {");

canvas = canvas.replace("b === BlockType.QuestNPC", "b === BlockType.QuestNPC || b === BlockType.GuideNPC || b === BlockType.GoblinNPC || b === BlockType.WizardNPC");
canvas = canvas.replace("closestInteractable.type === BlockType.QuestNPC", "closestInteractable.type === BlockType.QuestNPC || closestInteractable.type === BlockType.GuideNPC || closestInteractable.type === BlockType.GoblinNPC || closestInteractable.type === BlockType.WizardNPC");

fs.writeFileSync('src/components/GameCanvas.tsx', canvas);

let worldCode = fs.readFileSync('src/lib/world.ts', 'utf8');
worldCode = worldCode.replace("spawnInBiome((x, y, isDesert, isCold) => (x > WORLD_WIDTH/2 && isDesert), BlockType.QuestNPC);", "spawnInBiome((x, y, isDesert, isCold) => (x > WORLD_WIDTH/2 && isDesert), BlockType.GoblinNPC);");
worldCode = worldCode.replace("spawnInBiome((x, y, isDesert, isCold) => (x < WORLD_WIDTH/2 && isCold), BlockType.Merchant);", "spawnInBiome((x, y, isDesert, isCold) => (x < WORLD_WIDTH/2 && isCold), BlockType.WizardNPC);");
worldCode = worldCode.replace("for (let i = 0; i < 8; i++) spawnInBiome(() => true, BlockType.QuestNPC);", "for (let i = 0; i < 4; i++) spawnInBiome(() => true, BlockType.QuestNPC);\n  for (let i = 0; i < 4; i++) spawnInBiome(() => true, BlockType.GuideNPC);");
fs.writeFileSync('src/lib/world.ts', worldCode);
console.log('NPCs patched.');

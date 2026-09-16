const fs = require('fs');

let constants = fs.readFileSync('src/lib/constants.ts', 'utf8');
constants = constants.replace("export const WORLD_WIDTH = 512;", "export const WORLD_WIDTH = 1536;");
constants = constants.replace("export const WORLD_HEIGHT = 200;", "export const WORLD_HEIGHT = 400;");
fs.writeFileSync('src/lib/constants.ts', constants);

let worldCode = fs.readFileSync('src/lib/world.ts', 'utf8');
worldCode = worldCode.replace(
  "    const elevation = (noise.get(x * 0.005) * 40) + (noise2.get(x * 0.02) * 15);",
  "    let plateauLift = 0;\n    if (x < 300) {\n       plateauLift = (300 - x) * 0.3;\n    } else if (x > WORLD_WIDTH - 300) {\n       plateauLift = (x - (WORLD_WIDTH - 300)) * 0.3;\n    }\n    const elevation = (noise.get(x * 0.005) * 40) + (noise2.get(x * 0.02) * 15) - plateauLift;"
);

// We need more different NPC's to spawn in different places.
// Find the NPC spawning logic.
const npcPatch = `
  // Spawn more NPCs (Terraria style diversity)
  for (let i = 0; i < 5; i++) {
     spawnInBiome((x, y, isDesert, isCold) => (x > WORLD_WIDTH/2 && isDesert), BlockType.QuestNPC);
  }
  for (let i = 0; i < 5; i++) {
     spawnInBiome((x, y, isDesert, isCold) => (x < WORLD_WIDTH/2 && isCold), BlockType.Merchant);
  }
  // Standard spread
  for (let i = 0; i < 8; i++) spawnInBiome(() => true, BlockType.Merchant);
  for (let i = 0; i < 8; i++) spawnInBiome(() => true, BlockType.QuestNPC);
`;
worldCode = worldCode.replace(
  "  spawnInBiome(() => true, BlockType.Merchant);\n  spawnInBiome(() => true, BlockType.QuestNPC);",
  npcPatch
);

fs.writeFileSync('src/lib/world.ts', worldCode);
console.log('World generation patched.');

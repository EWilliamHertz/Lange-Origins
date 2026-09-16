import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

code = code.replace(/world\[centerX\]\[centerY - 1\] = BlockType\.QuestNPC;/, "world[centerX][centerY - 1] = BlockType.QuestNPC;\n  // Spawn Merchant nearby\n  world[centerX - 3][centerY - 1] = BlockType.Merchant;");

fs.writeFileSync('src/lib/world.ts', code);

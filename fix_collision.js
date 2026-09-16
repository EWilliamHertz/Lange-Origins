import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/BlockType\.QuestNPC, BlockType\.Merchant,/, "");

fs.writeFileSync('src/lib/constants.ts', code);

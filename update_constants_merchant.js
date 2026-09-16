import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/QuestNPC = 22,/, "QuestNPC = 22,\n  Merchant = 30,");
code = code.replace(/\[BlockType\.QuestNPC\]: '#FF4081',/, "[BlockType.QuestNPC]: '#FF4081',\n  [BlockType.Merchant]: '#9C27B0',");
code = code.replace(/BlockType\.AdminBrick, BlockType\.QuestNPC,/, "BlockType.AdminBrick, BlockType.QuestNPC, BlockType.Merchant,");
code = code.replace(/\[BlockType\.QuestNPC\]: Infinity,/, "[BlockType.QuestNPC]: Infinity,\n  [BlockType.Merchant]: Infinity,");
code = code.replace(/\[BlockType\.QuestNPC\]: 'Quest Guide',/, "[BlockType.QuestNPC]: 'Quest Guide',\n  [BlockType.Merchant]: 'Wandering Merchant',");

fs.writeFileSync('src/lib/constants.ts', code);

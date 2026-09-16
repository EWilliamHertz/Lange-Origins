import fs from 'fs';
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(/import \{ \n  Pickaxe,/, "import { \n  Store,\n  Pickaxe,");
code = code.replace(/case BlockType\.QuestNPC:/, "case BlockType.Merchant:\n      return <Store className={className} style={{ color: '#9C27B0' }} />;\n    case BlockType.QuestNPC:");

fs.writeFileSync('src/lib/icons.tsx', code);

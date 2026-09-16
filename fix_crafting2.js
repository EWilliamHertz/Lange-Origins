import fs from 'fs';
let code = fs.readFileSync('src/lib/crafting.ts', 'utf8');

code = code.replace(/export interface Recipe \{\n  pattern: \(BlockType \| null\)\[  \{/, "export interface Recipe {\n  pattern: (BlockType | null)[];\n  result: BlockType;\n  count: number;\n}\n\nexport const RECIPES: Recipe[] = [\n  {");

fs.writeFileSync('src/lib/crafting.ts', code);

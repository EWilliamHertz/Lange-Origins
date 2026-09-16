import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/{ type: BlockType.Grenade, count: 64 },/, "{ type: BlockType.Grenade, count: 64 },\n    { type: BlockType.Bullet, count: 64 },\n    { type: BlockType.Arrow, count: 64 },");
fs.writeFileSync('src/App.tsx', code);

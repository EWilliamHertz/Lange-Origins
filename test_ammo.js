import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/{ type: 304 \/\* BlockType.Grenade \*\/, count: 64 },/g, "{ type: 304 /* BlockType.Grenade */, count: 64 },\n                         { type: 303 /* BlockType.Bullet */, count: 64 },\n                         { type: 110 /* BlockType.Arrow */, count: 64 },");

fs.writeFileSync('src/App.tsx', code);

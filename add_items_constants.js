import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(/IronChestplate = 401\s*\}/, "IronChestplate = 401,\n  Gunpowder = 402,\n  Bone = 403\n}");
code = code.replace(/\[BlockType.IronChestplate\]: '#BDBDBD'\s*\};/, "[BlockType.IronChestplate]: '#BDBDBD',\n  [BlockType.Gunpowder]: '#757575',\n  [BlockType.Bone]: '#FFFFFF'\n};");
code = code.replace(/\[BlockType.IronChestplate\]: 0\s*\};/, "[BlockType.IronChestplate]: 0,\n  [BlockType.Gunpowder]: 0,\n  [BlockType.Bone]: 0\n};");
code = code.replace(/\[BlockType.IronChestplate\]: 'Iron Chestplate'\s*\};/, "[BlockType.IronChestplate]: 'Iron Chestplate',\n  [BlockType.Gunpowder]: 'Gunpowder',\n  [BlockType.Bone]: 'Bone'\n};");

fs.writeFileSync('src/lib/constants.ts', code);

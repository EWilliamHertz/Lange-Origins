import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const isEquipableFn = `const checkEquipable = (type: number) => (type >= 100 && type <= 109) || type === 302 || type === 400 || type === 401;`;

// Insert it somewhere at the top
code = code.replace(/const TILE_SIZE = 32;/, "const TILE_SIZE = 32;\n" + isEquipableFn);

// Replace usages
code = code.replace(/const isEquipable = target!\.type >= 100;/g, "const isEquipable = checkEquipable(target!.type);");
code = code.replace(/const isEquipable = type >= 100;/g, "const isEquipable = checkEquipable(type);");
code = code.replace(/const isEquipable = blockType >= 100;/g, "const isEquipable = checkEquipable(blockType);");

fs.writeFileSync('src/App.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/          onBlockMined=\{\(minedBlockType\) => \{[\s\S]*?if \(minedBlockType === BlockType\.DiamondOre\) blockType = BlockType\.Diamond;/, `          onBlockMined={(blockType) => {`);

fs.writeFileSync('src/App.tsx', code);

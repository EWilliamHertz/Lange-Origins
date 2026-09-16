import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onBlockMined=\{\(blockType\) => \{/, 
`onBlockMined={(minedBlockType) => {
            let blockType = minedBlockType;
            if (minedBlockType === BlockType.CoalOre) blockType = BlockType.Coal;
            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;`);

fs.writeFileSync('src/App.tsx', code);

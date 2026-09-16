import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /          onBlockMined=\{\(blockType\) => \{/;
const replacement = `          onBlockMined={(minedBlockType) => {
            let blockType = minedBlockType;
            if (minedBlockType === BlockType.CoalOre) blockType = BlockType.Coal;
            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);

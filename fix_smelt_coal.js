import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/if \(furnaceInput\.type === BlockType\.Sand\) outputType = BlockType\.Glass;/, 
`if (furnaceInput.type === BlockType.Sand) outputType = BlockType.Glass;
      if (furnaceInput.type === BlockType.CoalOre) outputType = BlockType.Coal;`);

fs.writeFileSync('src/App.tsx', code);

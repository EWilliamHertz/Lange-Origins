import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/          \}\}\n          \}\}\n          onBlockMined=\{(blockType) => \{/g, 
`          }}
          onBlockMined={(blockType) => {`);

fs.writeFileSync('src/App.tsx', code);

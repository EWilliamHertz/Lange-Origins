import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/          \}\} : null;\n              \}\n              return next;\n            \}\}\n          onBlockMined/g, "          }}\n          onBlockMined");

fs.writeFileSync('src/App.tsx', code);

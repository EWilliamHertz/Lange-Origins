import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/          \}\} : null;\n              \}\n              return next;\n            \}\}\)/g, "          }}");
// Wait, the issue is `: null; } return next; });`
// Let's just remove that line.
code = code.replace(/          \}\} : null;\n              \}\n              return next;\n            \}\);/g, "          }}");

fs.writeFileSync('src/App.tsx', code);

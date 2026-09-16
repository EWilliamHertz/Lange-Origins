const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/type === 105/g, 'type === 111');
code = code.replace(/type: 105/g, 'type: 111');
code = code.replace(/105 \/\* BlockType.GrapplingHook \*\//g, '111 /* BlockType.GrapplingHook */');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed 105 to 111 in App.tsx');

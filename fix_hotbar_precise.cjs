const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "{ type: 109, count: 1 },",
  "{ type: 105, count: 1 },"
);

code = code.replace(
  "{ type: 109 /* BlockType.Bow */, count: 1 },",
  "{ type: 105 /* BlockType.GrapplingHook */, count: 1 },"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hotbar arrays');

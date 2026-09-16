const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  "[BlockType.Arrow]: 'Arrow',",
  "[BlockType.Arrow]: 'Arrow',\n  [BlockType.GrapplingHook]: 'Grappling Hook',"
);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Added to BlockNames');

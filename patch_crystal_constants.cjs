const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  "[BlockType.AdminBrick]: '#37474F',",
  "[BlockType.AdminBrick]: '#37474F',\n  [BlockType.BlueCrystal]: '#1E88E5',"
);

code = code.replace(
  "[BlockType.AdminBrick]: Infinity,",
  "[BlockType.AdminBrick]: Infinity,\n  [BlockType.BlueCrystal]: 8,"
);

code = code.replace(
  "BlockType.AdminBrick,",
  "BlockType.AdminBrick, BlockType.BlueCrystal,"
);

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Crystal constants patched.');

const fs = require('fs');
let code = fs.readFileSync('src/lib/crafting.ts', 'utf8');

code = code.replace(
  "  {",
  `  {
    pattern: [
      BlockType.IronIngot, BlockType.IronIngot, BlockType.IronIngot,
      null, BlockType.Wire, null,
      null, BlockType.Wire, null
    ],
    result: BlockType.GrapplingHook,
    count: 1
  },
  {`
);

fs.writeFileSync('src/lib/crafting.ts', code);
console.log('Added recipe to crafting.ts');

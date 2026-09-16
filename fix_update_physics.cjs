const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "updatePhysics(player, world, keysToUse);",
  "updatePhysics(player, world, keysToUse, propsRef.current.skills?.speed || 0);"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed updatePhysics call');

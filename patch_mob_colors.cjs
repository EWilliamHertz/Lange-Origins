const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "         } else if (mob.type === 'skeleton') {\n            ctx.fillStyle = '#eeeeee'; // white bones",
  "         } else if (mob.type === 'skeleton') {\n            ctx.fillStyle = '#FF69B4'; // hot pink skeleton"
);

code = code.replace(
  "         } else if (mob.type === 'creeper') {\n            ctx.fillStyle = '#4caf50'; // bright green",
  "         } else if (mob.type === 'creeper') {\n            ctx.fillStyle = '#2196F3'; // blue creeper"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Mob colors patched.');

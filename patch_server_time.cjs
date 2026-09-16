const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const timeOfDay = (0.35 + elapsedMs * 0.00001) % 1.0;\n           const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;",
  "const timeOfDay = (0.35 + elapsedMs * 0.000005) % 1.0;\n           const isNight = timeOfDay < 0.1 || timeOfDay > 0.9;"
);

fs.writeFileSync('server.ts', code);
console.log('Server time patched.');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "          characterSkin={characterSkin}\n          kills={kills}",
  "          characterSkin={characterSkin}\n          kills={kills}\n          skills={skills}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added skills to GameCanvas props');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onHealthChange={setHealth}",
  "onHealthChange={setHealth}\n          skills={skills}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added skills prop');

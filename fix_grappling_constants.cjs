const fs = require('fs');
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

code = code.replace(
  "Arrow = 110,",
  "Arrow = 110,\n  GrapplingHook = 111,"
);

// We need to check if [BlockType.GrapplingHook] already exists and remove the old hardcoded ones or duplicates
// Wait, I should just check if [BlockType.GrapplingHook] is already there.

fs.writeFileSync('src/lib/constants.ts', code);
console.log('Added GrapplingHook to enum');

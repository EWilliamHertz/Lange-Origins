const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "type: 'trade' | 'gang' | 'friend';",
  "type: 'trade' | 'gang' | 'friend' | 'duel' | 'system' | 'level_up';"
);
appCode = appCode.replace(
  "type: 'trade' | 'gang' | 'friend'",
  "type: 'trade' | 'gang' | 'friend' | 'duel' | 'system' | 'level_up'"
);
fs.writeFileSync('src/App.tsx', appCode);

let constCode = fs.readFileSync('src/lib/constants.ts', 'utf8');
// It seems BlockType.MagicStaff was replaced multiple times or something.
// Let's just fix it by ensuring we only have one definition for BlockColors.
// Since it complained about "An object literal cannot have multiple properties with the same name.", I might have added them multiple times?
// I will just read constants.ts and see the problem lines.

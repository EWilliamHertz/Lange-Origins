const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "type NotificationType = 'trade' | 'gang' | 'friend';",
  "type NotificationType = 'trade' | 'gang' | 'friend' | 'duel' | 'system' | 'level_up';"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed notification types');

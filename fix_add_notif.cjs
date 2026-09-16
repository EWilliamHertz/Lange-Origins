const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const addNotification = (type: 'trade'|'gang'|'friend', senderId: string, senderName: string) => {",
  "const addNotification = (type: 'trade'|'gang'|'friend'|'duel'|'system'|'level_up', senderId: string, senderName: string) => {"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed addNotification signature');

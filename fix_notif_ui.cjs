const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "{notif.type === 'friend' && <span className=\"font-bold\">{notif.senderName} sent friend request!</span>}",
  `{notif.type === 'friend' && <span className="font-bold">{notif.senderName} sent friend request!</span>}
                    {notif.type === 'duel' && <span className="font-bold text-red-400">{notif.senderName} challenged you to a duel!</span>}
                    {notif.type === 'system' && <span className="font-bold text-amber-400">{notif.senderName}</span>}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed notification UI rendering');

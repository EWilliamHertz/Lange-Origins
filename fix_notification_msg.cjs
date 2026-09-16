const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetAdd = `  const addNotification = (type: 'trade'|'gang'|'friend'|'duel'|'system'|'level_up', senderId: string, senderName: string) => {
     setNotifications(prev => [...prev, { id: Math.random().toString(), type, senderId, senderName, timestamp: Date.now() }]);
  };`;

const replaceAdd = `  const addNotification = (type: 'trade'|'gang'|'friend'|'duel'|'system'|'level_up', senderId: string, senderName: string, msg?: string) => {
     setNotifications(prev => [...prev, { id: Math.random().toString(), type, senderId, senderName, msg, timestamp: Date.now() }]);
  };`;

code = code.replace(targetAdd, replaceAdd);

const targetSys1 = `                      addNotification('system', 'System', 'Level Up! Press E to upgrade skills.');`;
const replaceSys1 = `                      addNotification('system', 'System', 'System', 'Level Up! Press E to upgrade skills.');`;

// Replace all occurrences of this (since there are 2)
code = code.split(targetSys1).join(replaceSys1);

// Also fix the system notifications array interface
const targetInterface = `  const [notifications, setNotifications] = useState<{id: string, type: 'trade'|'gang'|'friend', senderId: string, senderName: string, timestamp: number}[]>([]);`;
const replaceInterface = `  const [notifications, setNotifications] = useState<{id: string, type: string, senderId: string, senderName: string, msg?: string, timestamp: number}[]>([]);`;
code = code.replace(targetInterface, replaceInterface);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed notification message passing');

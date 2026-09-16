const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hookQ5 = `            if (blockType === BlockType.BlueCrystal) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q5' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                   const newCount = q.current + 1;
                   if (newCount >= q.goal && !q.completed) {
                     setNotifications(n => [...n, { id: Math.random().toString(), type: 'system', senderName: 'System', timestamp: Date.now(), msg: 'Magic Unlocked!' }]);
                   }
                   return { ...q, current: newCount, completed: newCount >= q.goal };
                 }
                 return q;
               }));
            }`;

code = code.replace(
  /            if \(blockType === BlockType.Wood\) \{/,
  hookQ5 + "\n            if (blockType === BlockType.Wood) {"
);

fs.writeFileSync('src/App.tsx', code);
console.log('onBlockMined patched.');

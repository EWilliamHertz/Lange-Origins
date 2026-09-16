const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const duelNotifListener = `
      socketRef.current.on('duel_request', (data: { senderId: string, senderName: string }) => {
        setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'duel', senderId: data.senderId, senderName: data.senderName, timestamp: Date.now(), msg: 'Wants to duel you!' } as any]);
      });
      socketRef.current.on('duel_started', (data: { opponentId: string, opponentName: string }) => {
        setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: 'Duel started against ' + data.opponentName + '!', timestamp: Date.now() }]);
        // Here we could set a 'duelingOpponentId' state to allow PVP damage to them
      });
`;
code = code.replace("      socketRef.current.on('friend_request', (data: { senderId: string, senderName: string }) => {", duelNotifListener + "\n      socketRef.current.on('friend_request', (data: { senderId: string, senderName: string }) => {");

const duelNotifRender = `
                  {notif.type === 'duel' && (
                     <div className="flex gap-2 w-full mt-2">
                       <button 
                         onClick={() => {
                            if (socketRef.current) socketRef.current.emit('accept_duel', { senderId: notif.senderId });
                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                         }}
                         className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1 rounded text-xs font-bold border border-red-500/30 transition-colors"
                       >Accept</button>
                       <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-1 rounded text-xs font-bold transition-colors">Decline</button>
                     </div>
                  )}
                  {notif.type === 'trade' && (`;

code = code.replace("                  {notif.type === 'trade' && (", duelNotifRender);


fs.writeFileSync('src/App.tsx', code);
console.log("App patched for duel notif.");

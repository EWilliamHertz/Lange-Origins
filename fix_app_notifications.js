import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const notifState = `
  const [notifications, setNotifications] = useState<{id: string, type: 'trade'|'gang', senderId: string, senderName: string, timestamp: number}[]>([]);
  
  const addNotification = (type: 'trade'|'gang', senderId: string, senderName: string) => {
     setNotifications(prev => [...prev, { id: Math.random().toString(), type, senderId, senderName, timestamp: Date.now() }]);
  };
`;

code = code.replace(/const \[chatMessages, setChatMessages\] = useState<\{sender: string, text: string\}\[\]>\(\[\]\);/, notifState + "\n  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([]);");

code = code.replace(/alert\("Trade request sent to " \+ interactPlayerName \+ "! \(Trading system foundation ready\)"\);/, 
`if (socketRef.current) socketRef.current.emit('send_trade_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'trade', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Trade request sent.' } as any]);`);

code = code.replace(/alert\("Invited " \+ interactPlayerName \+ " to your gang! \(Gang system foundation ready\)"\);/, 
`if (socketRef.current) socketRef.current.emit('send_gang_invite', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'gang', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Gang invite sent.' } as any]);`);

const notifUI = `
      {/* Notifications Overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-black/80 backdrop-blur-md border border-neutral-700 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3">
               {n.type === 'trade' ? <Star className="text-amber-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}
               <div>
                 <p className="text-sm font-bold text-white">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : 'Gang Invite')}</p>
                 <p className="text-xs text-neutral-400">{n.msg ? '' : \`From \${n.senderName}\`}</p>
               </div>
             </div>
             <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-neutral-500 hover:text-white p-1">
               ✕
             </button>
          </div>
        ))}
      </div>
`;

code = code.replace(/\{furnaceOpen && \(/, notifUI + "\n      {furnaceOpen && (");

const canvasProps = `
          onTradeRequest={(senderId, senderName) => addNotification('trade', senderId, senderName)}
          onGangInvite={(senderId, senderName) => addNotification('gang', senderId, senderName)}
`;
code = code.replace(/onHealthChange=\{setHealth\}/, "onHealthChange={setHealth}\n" + canvasProps);

fs.writeFileSync('src/App.tsx', code);

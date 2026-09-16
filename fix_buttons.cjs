const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetButtons = `             <div className="flex flex-col gap-1">
               <button onClick={() => {
                  setNotifications(prev => prev.filter(x => x.id !== n.id));
                  if (n.type === 'trade') {
                      setIsChatOpen(true);
                      if (chatInputRef.current) {
                          chatInputRef.current.value = 'I accept your trade request!';
                          chatInputRef.current.focus();
                      }
                  } else if (n.type === 'gang') {
                      setSendChatMsg({text: 'I joined your gang!', timestamp: Date.now()});
                      if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I joined your gang!', room: serverName });
                  } else if (n.type === 'friend') {
                      setSendChatMsg({text: 'I accepted your friend request!', timestamp: Date.now()});
                      if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I accepted your friend request!', room: serverName });
                  }
               }} className="bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                 Accept
               </button>
               <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="bg-neutral-600/80 hover:bg-neutral-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                 Decline
               </button>
             </div>`;

const replaceButtons = `             <div className="flex flex-col gap-1">
               {n.type === 'system' || n.type === 'level_up' ? (
                  <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="bg-neutral-600/80 hover:bg-neutral-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                    Dismiss
                  </button>
               ) : (
                  <>
                     <button onClick={() => {
                        setNotifications(prev => prev.filter(x => x.id !== n.id));
                        if (n.type === 'trade') {
                            setIsChatOpen(true);
                            if (chatInputRef.current) {
                                chatInputRef.current.value = 'I accept your trade request!';
                                chatInputRef.current.focus();
                            }
                        } else if (n.type === 'gang') {
                            setSendChatMsg({text: 'I joined your gang!', timestamp: Date.now()});
                            if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I joined your gang!', room: serverName });
                        } else if (n.type === 'friend') {
                            setSendChatMsg({text: 'I accepted your friend request!', timestamp: Date.now()});
                            if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I accepted your friend request!', room: serverName });
                        }
                     }} className="bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                       Accept
                     </button>
                     <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="bg-neutral-600/80 hover:bg-neutral-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                       Decline
                     </button>
                  </>
               )}
             </div>`;

code = code.replace(targetButtons, replaceButtons);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed buttons');

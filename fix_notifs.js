import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const notifOld = `             <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-neutral-500 hover:text-white p-1">
               ✕
             </button>`;

const notifNew = `             <div className="flex flex-col gap-1">
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

code = code.replace(notifOld, notifNew);

// Add friend request to the socket emitting
const friendOld = `              <button 
                onClick={() => {
                  alert("Friend request sent to " + interactPlayerName + "!");
                  setInteractPlayerId(null);
                }}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-3 rounded-xl font-bold border border-emerald-500/30 transition-colors"
              >
                Add Friend
              </button>`;

const friendNew = `              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_friend_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'friend', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Friend request sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-3 rounded-xl font-bold border border-emerald-500/30 transition-colors"
              >
                Add Friend
              </button>`;
              
code = code.replace(friendOld, friendNew);

// Adjust addNotification for friend
const notifDefOld = `const [notifications, setNotifications] = useState<{id: string, type: 'trade'|'gang', senderId: string, senderName: string, timestamp: number, msg?: string}[]>([]);
  
  const addNotification = (type: 'trade'|'gang', senderId: string, senderName: string) => {`;
  
const notifDefNew = `const [notifications, setNotifications] = useState<{id: string, type: 'trade'|'gang'|'friend', senderId: string, senderName: string, timestamp: number, msg?: string}[]>([]);
  
  const addNotification = (type: 'trade'|'gang'|'friend', senderId: string, senderName: string) => {`;

code = code.replace(notifDefOld, notifDefNew);

// Fix GameCanvas adding onFriendRequest
const canvasOld = `          onTradeRequest={(senderId, senderName) => addNotification('trade', senderId, senderName)}
          onGangInvite={(senderId, senderName) => addNotification('gang', senderId, senderName)}`;

const canvasNew = `          onTradeRequest={(senderId, senderName) => addNotification('trade', senderId, senderName)}
          onGangInvite={(senderId, senderName) => addNotification('gang', senderId, senderName)}
          onFriendRequest={(senderId, senderName) => addNotification('friend', senderId, senderName)}`;

code = code.replace(canvasOld, canvasNew);

// Fix the notification icons:
const notifIconOld = `{n.type === 'trade' ? <Star className="text-amber-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}`;
const notifIconNew = `{n.type === 'trade' ? <Star className="text-amber-500 w-5 h-5" /> : n.type === 'friend' ? <Heart className="text-emerald-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}`;

code = code.replace(notifIconOld, notifIconNew);

const notifMsgOld = `<p className="text-sm font-bold text-white">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : 'Gang Invite')}</p>`;
const notifMsgNew = `<p className="text-sm font-bold text-white">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : n.type === 'friend' ? 'Friend Request' : 'Gang Invite')}</p>`;

code = code.replace(notifMsgOld, notifMsgNew);


fs.writeFileSync('src/App.tsx', code);

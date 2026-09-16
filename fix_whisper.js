import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const profileOld = `              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_gang_invite', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'gang', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Gang invite sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-3 rounded-xl font-bold border border-blue-500/30 transition-colors"
              >
                Invite to Gang
              </button>
              <button 
                onClick={() => setInteractPlayerId(null)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
              >
                Cancel
              </button>`;
              
const profileNew = `              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_gang_invite', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'gang', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Gang invite sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-3 rounded-xl font-bold border border-blue-500/30 transition-colors"
              >
                Invite to Gang
              </button>
              <button 
                onClick={() => {
                  setIsChatOpen(true);
                  if (chatInputRef.current) {
                     chatInputRef.current.value = '/whisper ' + interactPlayerName + ' ';
                     chatInputRef.current.focus();
                  }
                  setInteractPlayerId(null);
                }}
                className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 py-3 rounded-xl font-bold border border-purple-500/30 transition-colors"
              >
                Whisper
              </button>
              <button 
                onClick={() => {
                  alert("Friend request sent to " + interactPlayerName + "!");
                  setInteractPlayerId(null);
                }}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-3 rounded-xl font-bold border border-emerald-500/30 transition-colors"
              >
                Add Friend
              </button>
              <button 
                onClick={() => setInteractPlayerId(null)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
              >
                Cancel
              </button>`;

code = code.replace(profileOld, profileNew);
fs.writeFileSync('src/App.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldJoin = `                            {friend.isOnline && friend.serverId && (
                               <div className="flex gap-2">
                                  <button 
                                      onClick={() => joinServer(friend.serverId)}
                                      className="bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 text-sm font-bold rounded border border-emerald-500/30 transition-colors"
                                  >
                                      Join
                                  </button>
                               </div>
                            )}`;

const newJoin = `                            {friend.isOnline && friend.serverId && (
                               <div className="flex gap-2">
                                  <button 
                                      onClick={() => {
                                         // Just join their server directly and open chat with whisper pre-filled
                                         joinServer(friend.serverId);
                                         setTimeout(() => {
                                            setIsChatOpen(true);
                                            if (chatInputRef.current) {
                                                chatInputRef.current.value = \`/whisper \${friend.name} \`;
                                                chatInputRef.current.focus();
                                            }
                                         }, 1500);
                                      }}
                                      className="bg-purple-600/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 text-sm font-bold rounded border border-purple-500/30 transition-colors"
                                  >
                                      Whisper
                                  </button>
                                  <button 
                                      onClick={() => joinServer(friend.serverId)}
                                      className="bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 text-sm font-bold rounded border border-emerald-500/30 transition-colors"
                                  >
                                      Join
                                  </button>
                               </div>
                            )}`;

code = code.replace(oldJoin, newJoin);
fs.writeFileSync('src/App.tsx', code);

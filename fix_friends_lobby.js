import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLobbyState = `  const [lobbyTab, setLobbyTab] = useState<'play' | 'marketplace'>('play');
  const [marketBlueprints, setMarketBlueprints] = useState<any[]>([]);`;
  
const newLobbyState = `  const [lobbyTab, setLobbyTab] = useState<'play' | 'marketplace' | 'friends'>('play');
  const [marketBlueprints, setMarketBlueprints] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<{name: string, serverId: string, isOnline: boolean}[]>([
      { name: "Zudran", serverId: "Public-1", isOnline: true },
      { name: "Alice", serverId: "MyBase", isOnline: true },
      { name: "Bob", serverId: "", isOnline: false },
  ]);`;

code = code.replace(oldLobbyState, newLobbyState);

const oldLobbyTabs = `               <div className="flex bg-[#0A0A0B] p-1 rounded-xl mb-6 shadow-inner border border-neutral-800">
                  <button 
                    onClick={() => setLobbyTab('play')}
                    className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${lobbyTab === 'play' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}\`}
                  >
                    Play
                  </button>
                  <button 
                    onClick={() => setLobbyTab('marketplace')}
                    className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${lobbyTab === 'marketplace' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}\`}
                  >
                    <Star size={16} /> Workshop
                  </button>
               </div>`;
               
const newLobbyTabs = `               <div className="flex bg-[#0A0A0B] p-1 rounded-xl mb-6 shadow-inner border border-neutral-800">
                  <button 
                    onClick={() => setLobbyTab('play')}
                    className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${lobbyTab === 'play' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}\`}
                  >
                    Play
                  </button>
                  <button 
                    onClick={() => setLobbyTab('friends')}
                    className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${lobbyTab === 'friends' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}\`}
                  >
                    <User size={16} /> Friends
                  </button>
                  <button 
                    onClick={() => setLobbyTab('marketplace')}
                    className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${lobbyTab === 'marketplace' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}\`}
                  >
                    <Star size={16} /> Workshop
                  </button>
               </div>`;
               
code = code.replace(oldLobbyTabs, newLobbyTabs);

const oldLobbyContent = `               {lobbyTab === 'marketplace' ? (`;

const newLobbyContent = `               {lobbyTab === 'friends' ? (
                  <div className="flex flex-col gap-4">
                     <h3 className="font-bold text-white mb-2">My Friends List</h3>
                     {friendsList.map((friend, i) => (
                        <div key={i} className="bg-neutral-800/50 border border-neutral-700/50 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="relative">
                                  <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                                      <User size={20} className="text-neutral-400" />
                                  </div>
                                  <div className={\`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 \${friend.isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}\`} />
                               </div>
                               <div>
                                  <div className="font-bold text-neutral-200">{friend.name}</div>
                                  <div className="text-xs text-neutral-500">
                                      {friend.isOnline ? (friend.serverId ? \`Playing in \${friend.serverId}\` : 'Online in Lobby') : 'Offline'}
                                  </div>
                               </div>
                            </div>
                            {friend.isOnline && friend.serverId && (
                               <div className="flex gap-2">
                                  <button 
                                      onClick={() => joinServer(friend.serverId)}
                                      className="bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 text-sm font-bold rounded border border-emerald-500/30 transition-colors"
                                  >
                                      Join
                                  </button>
                               </div>
                            )}
                        </div>
                     ))}
                  </div>
               ) : lobbyTab === 'marketplace' ? (`;

code = code.replace(oldLobbyContent, newLobbyContent);

fs.writeFileSync('src/App.tsx', code);

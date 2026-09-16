import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 shrink-0">
               <button 
                  onClick={() => setLobbyTab('play')}
                  className={\`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all \${lobbyTab === 'play' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:text-white'}\`}
               >Live Servers</button>
               <button 
                  onClick={() => setLobbyTab('marketplace')}
                  className={\`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-2 \${lobbyTab === 'marketplace' ? 'bg-emerald-600/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}\`}
               ><ShoppingBag size={14}/> Marketplace</button>
            </div>
            
            {lobbyTab === 'play' ? (
              <div className="flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                    <Star size={14} className="text-amber-500" /> Favorites
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favoriteServers.length > 0 ? favoriteServers.map(srv => (
                      <div key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                        <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv}</span>
                        <button onClick={(e) => toggleFavorite(srv, e)} className="text-amber-500 hover:text-amber-400 p-1">
                          <Star size={18} fill="currentColor" />
                        </button>
                      </div>
                    )) : <p className="text-neutral-600 text-sm italic py-2">No favorites yet.</p>}
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                    <Globe size={14} className="text-blue-500" /> Public Realms
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publicServers.map(srv => (
                      <div key={srv.id} onClick={() => joinServer(srv.id)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                        <div>
                          <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv.id}</div>
                          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5"><User size={12} /> {srv.players} online</div>
                        </div>
                        <button onClick={(e) => toggleFavorite(srv.id, e)} className="text-neutral-600 hover:text-amber-500 p-1 transition-colors">
                          <Star size={18} fill={favoriteServers.includes(srv.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-neutral-500" /> Recent
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentServers.length > 0 ? recentServers.map(srv => (
                      <button key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                        {srv}
                      </button>
                    )) : <p className="text-neutral-600 text-sm italic py-1">No recent servers.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                 <div className="bg-[#1A1A1E] rounded-2xl p-5 border border-emerald-500/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-1">Publish Your World</h4>
                      <p className="text-sm text-neutral-400">Share your custom realm or minigame blueprint with the community.</p>
                    </div>
                    <button onClick={() => publishBlueprint()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 shadow-lg shadow-emerald-900/50">Publish World</button>
                 </div>
                 
                 <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2 mt-4 flex items-center gap-2">
                   <Globe size={14} className="text-emerald-500" /> Community Blueprints
                 </h3>
                 <div className="grid grid-cols-1 gap-4 pb-4">
                   {marketBlueprints.length > 0 ? marketBlueprints.map(bp => (
                      <div key={bp.id} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-emerald-500/30 p-4 rounded-2xl transition-all flex flex-col gap-3 group">
                         <div className="flex items-center justify-between">
                            <div className="font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors text-lg">{bp.name}</div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                               <Heart size={12} className="text-red-500/70" /> {bp.likes || 0}
                            </div>
                         </div>
                         <p className="text-sm text-neutral-400 leading-relaxed italic">{bp.description}</p>
                         <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                            <span className="text-xs text-neutral-500 flex items-center gap-1.5"><User size={12}/> By {bp.creatorName || 'Unknown'}</span>
                            <button onClick={() => { Sounds.click(); joinServer(bp.roomId); }} className="bg-emerald-600/20 hover:bg-emerald-500 hover:text-white text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500">
                               Join Instance
                            </button>
                         </div>
                      </div>
                   )) : <p className="text-neutral-600 text-sm italic">Loading blueprints...</p>}
                 </div>
              </div>
            )}
          </div>
`;

const startIndex = code.indexOf('<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">');
const endIndex = code.indexOf('          </div>\n          </div>\n          \n          {/* Player Profile Manager */}');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully replaced middle column.");
} else {
  console.log("Could not find start or end index.");
}
